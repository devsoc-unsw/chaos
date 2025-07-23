//! Database transaction handling for Chaos.
//! 
//! This module provides functionality for managing database transactions
//! in a type-safe way, with integration into the Axum web framework.

use crate::models::app::AppState;
use crate::models::error::ChaosError;
use axum::async_trait;
use axum::extract::{FromRef, FromRequestParts};
use axum::http::request::Parts;
use sqlx::{Postgres, Transaction};

/// A wrapper around a PostgreSQL transaction.
/// 
/// This struct provides a type-safe way to handle database transactions
/// in request handlers. It automatically begins a transaction when extracted
/// from a request.
pub struct DBTransaction<'a> {
    /// The underlying PostgreSQL transaction
    pub tx: Transaction<'a, Postgres>,
}

/// Implementation of `FromRequestParts` for `DBTransaction`.
/// 
/// This allows `DBTransaction` to be used as an extractor in Axum route handlers.
/// When extracted, it automatically begins a new transaction from the application's
/// database connection pool.
#[async_trait]
impl<S> FromRequestParts<S> for DBTransaction<'_>
where
    AppState: FromRef<S>,
    S: Send + Sync,
{
    type Rejection = ChaosError;

    /// Extracts a new database transaction from the request state.
    /// 
    /// # Arguments
    /// * `_` - The request parts (unused)
    /// * `state` - The application state containing the database connection pool
    /// 
    /// # Returns
    /// Returns a `Result` containing either:
    /// * `Ok(DBTransaction)` - A new database transaction
    /// * `Err(ChaosError)` - An error if transaction creation fails
    async fn from_request_parts(_: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let app_state = AppState::from_ref(state);

        Ok(DBTransaction {
            tx: app_state.db.begin().await?,
        })
    }
}
