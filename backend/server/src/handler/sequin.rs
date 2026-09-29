//! Sequin webhook handler for the Chaos application.
//!
//! Sequin streams Postgres changes to [`SequinHandler::spicedb_webhook`], which
//! turns each change into the SpiceDB relationships its row owns. This is the
//! catch-up path: it converges SpiceDB with Postgres for writes that happened
//! outside a request (or whose SpiceDB write failed), so authorization checks
//! stay correct without every write path having to be perfect.
//!
//! The mapping lives in [`service::sequin`] so the table-to-relationship logic
//! is testable without an HTTP layer.

use crate::models::app::AppState;
use crate::models::error::ChaosError;
use crate::service::sequin::{apply_batch, SequinBatch};
use axum::extract::State;
use axum::http::{HeaderMap, StatusCode};
use axum::response::IntoResponse;
use axum::Json;
use serde_json::json;

/// Handler for Sequin's change-data-capture webhooks.
pub struct SequinHandler;

impl SequinHandler {
    /// Receives a batch of Postgres changes and applies them to SpiceDB.
    ///
    /// Sequin POSTs `{"data": [...]}` here (the sink is configured with
    /// `batch: true`), and retries a batch indefinitely with exponential backoff
    /// until it gets a 2XX. So this must return 2XX only once the batch is
    /// durably applied: any error here means the batch is replayed.
    ///
    /// Replay is safe by construction. Every relationship write is either a
    /// `Touch` (an idempotent upsert) or a `Delete` of a relationship that
    /// SpiceDB treats as a no-op when absent, so re-applying a batch converges
    /// rather than failing. That removes the need to track Sequin's
    /// `idempotency_key` ourselves.
    ///
    /// The batch is coalesced before writing: SpiceDB rejects two updates to
    /// the same relationship in one call, so a batch that both inserts and
    /// deletes the same row must send one update, not two. See
    /// [`apply_batch`].
    ///
    /// # Arguments
    ///
    /// * `state` - The application state, holding the SpiceDB client and key
    /// * `headers` - Request headers, checked for the shared-secret bearer token
    /// * `batch` - The deserialised Sequin batch
    ///
    /// # Returns
    ///
    /// * `Result<impl IntoResponse, ChaosError>` - 200 once applied, 401 when the
    ///   secret does not match, 500 when SpiceDB rejects the batch (Sequin retries)
    pub async fn spicedb_webhook(
        State(state): State<AppState>,
        headers: HeaderMap,
        Json(batch): Json<SequinBatch>,
    ) -> Result<impl IntoResponse, ChaosError> {
        authorize(&headers, &state)?;

        let applied = apply_batch(&state, &batch).await?;

        Ok((
            StatusCode::OK,
            Json(json!({ "applied": applied, "received": batch.data.len() })),
        ))
    }
}

/// Rejects the request unless it carries the configured bearer token.
///
/// This endpoint can rewrite every permission in the system, so it must not be
/// reachable without the secret. The comparison walks both strings in full
/// rather than short-circuiting, so a caller cannot recover the token byte by
/// byte from response timing.
///
/// # Arguments
///
/// * `headers` - Request headers to read `Authorization` from
/// * `state` - The application state, holding the expected secret
///
/// # Returns
///
/// * `Ok(())` when the token matches
/// * `Err(ChaosError::NotLoggedIn)` when it does not
fn authorize(headers: &HeaderMap, state: &AppState) -> Result<(), ChaosError> {
    let expected = state.sequin_webhook_secret.as_str();

    let presented = headers
        .get(axum::http::header::AUTHORIZATION)
        .and_then(|value| value.to_str().ok())
        .and_then(|value| value.strip_prefix("Bearer "))
        .unwrap_or_default();

    let matches = !expected.is_empty() && constant_time_eq(presented, expected);

    if matches {
        Ok(())
    } else {
        Err(ChaosError::NotLoggedIn)
    }
}

/// Compares two strings without leaking their contents through timing.
///
/// Accumulates byte differences over the whole input instead of returning at
/// the first mismatch. `false` for unequal lengths, which is itself not secret
/// (the token is compared against a configured value of known length).
fn constant_time_eq(a: &str, b: &str) -> bool {
    if a.len() != b.len() {
        return false;
    }
    let mut difference = 0u8;
    for (x, y) in a.bytes().zip(b.bytes()) {
        difference |= x ^ y;
    }
    difference == 0
}
