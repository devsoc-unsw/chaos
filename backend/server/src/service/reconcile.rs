//! Periodic reconciliation of SpiceDB against Postgres.
//!
//! Sequin's CDC stream is the primary path, but it is not a complete repair
//! mechanism. A backfill re-asserts relationships for rows that *exist*, so it
//! heals relationships that are missing but cannot retract one that is orphaned:
//! a relationship whose row is gone from Postgres. A stale grant left behind by
//! a failed or reordered write is exactly that, and nothing later removes it.
//!
//! Each run therefore does two things:
//!
//! 1. Triggers a Sequin backfill over the Management API, which re-delivers
//!    every current row to the webhook as a `read` and re-asserts it.
//! 2. Diffs SpiceDB against Postgres directly and removes the orphans, which is
//!    the half the backfill cannot reach.
//!
//! Deletion is opt-in. Runs report orphans and, unless `RECONCILE_DELETE` is
//! set, change nothing.

use crate::models::app::AppState;
use crate::models::error::ChaosError;
use crate::service::sequin::{publish_token, relationships_for_row, RelKey, REPLICATED_TABLES};
use crate::spicedb::authzed::api::v1::relationship_update::Operation;
use crate::spicedb::authzed::api::v1::Relationship;
use crate::spicedb::schema::resource;
use crate::spicedb::{delete_relationship, read_relationships_of_type, write_relationships};
use serde_json::Value;
use sqlx::postgres::{PgAdvisoryLock, PgAdvisoryLockKey};
use sqlx::Either;
use std::collections::HashSet;
use std::time::Duration;

/// A relationship identity used to compare Postgres against SpiceDB.
///
/// Same five fields as [`RelKey`], but owned. The mapping in
/// `relationships_for_row` yields `&'static str` type and relation names because
/// they come from the generated schema constants, whereas a relationship read
/// back from SpiceDB has runtime `String`s. Comparing needs owned values, so the
/// expected set is converted once rather than trying to borrow from either side.
type StoredKey = (String, i64, String, String, i64);

/// Converts a mapping key into the comparable owned form.
fn to_stored_key(key: RelKey) -> StoredKey {
    let (resource_type, resource_id, relation, subject_type, subject_id) = key;
    (
        resource_type.to_owned(),
        resource_id,
        relation.to_owned(),
        subject_type.to_owned(),
        subject_id,
    )
}

/// Advisory-lock key electing the single reconciler (`"CHAOS_RC"`).
///
/// Distinct from the retired ETL key so a rollout cannot have the two contend.
/// Per-database, so separate environments sharing a cluster never contend.
const RECONCILE_LOCK_KEY: i64 = 0x4348_4153_5f52_4300;

/// Default seconds between runs (1 hour).
const DEFAULT_INTERVAL_SECS: u64 = 3600;

/// Sink name the backfill is triggered against, matching `sequin.yaml`.
const SINK_NAME: &str = "chaos-spicedb";

/// SpiceDB resource types whose relationships the Chaos application owns.
///
/// The sweep only ever considers these, so a relationship written by something
/// else is never a deletion candidate. Every type here is the *resource* side of
/// a relationship produced by `relationships_for_row`.
const MANAGED_RESOURCE_TYPES: &[&str] = &[
    resource::PLATFORM,
    resource::USER,
    resource::ORGANISATION,
    resource::CAMPAIGN,
    resource::CAMPAIGN_ROLE,
    resource::APPLICATION,
    resource::QUESTION,
    resource::RATING_CATEGORY,
    resource::RATING,
    resource::CATEGORY_RATING,
    resource::COMMENT,
    resource::ANSWER,
    resource::OFFER,
    resource::EMAIL_TEMPLATE,
];

/// What one reconciliation run found.
#[derive(Debug, Default)]
pub struct Report {
    /// Relationships Postgres justifies and SpiceDB holds.
    pub matched: usize,

    /// Relationships Postgres justifies that SpiceDB does not hold. The
    /// backfill is what repairs these.
    pub missing: usize,

    /// Relationships SpiceDB holds that Postgres no longer justifies. Only
    /// these are deletion candidates. Held as the relationships exactly as they
    /// were read, so a delete cannot drift from what was found.
    pub orphans: Vec<Relationship>,

    /// Whether the orphans were actually deleted.
    pub deleted: bool,
}

/// Reads a boolean environment variable, treating anything but "true" as false.
fn env_flag(name: &str) -> bool {
    matches!(std::env::var(name).as_deref(), Ok("true"))
}

/// Reads an env-provided seconds value, falling back to `default`.
fn env_secs(name: &str, default: u64) -> u64 {
    std::env::var(name)
        .ok()
        .and_then(|value| value.parse().ok())
        .filter(|value| *value > 0)
        .unwrap_or(default)
}

/// Builds the set of relationships Postgres currently justifies.
///
/// Walks every replicated table and maps each row through the same
/// `relationships_for_row` the CDC webhook uses, so the two can never disagree
/// about what a row owns. A disagreement here would be indistinguishable from an
/// orphan and would get it deleted, which is why the mapping is shared rather
/// than reimplemented.
///
/// Any Postgres failure aborts the whole build, which in turn aborts the run
/// before any SpiceDB write. This is the important safety property: an
/// incomplete *expected* set is the only way this sweep can delete a correct
/// relationship, so it must never be possible to act on a partial one.
///
/// Every table is read inside one `REPEATABLE READ` transaction, so the expected
/// set is a single consistent snapshot rather than fourteen independently-timed
/// ones. That keeps the set self-consistent while it is being assembled; it does
/// not replace the read ordering in [`run_once`], which is what makes the
/// comparison itself safe.
///
/// # Arguments
///
/// * `state` - The application state, holding the database pool
///
/// # Returns
///
/// * `Ok(HashSet<StoredKey>)` of every relationship the current rows justify
/// * `Err(ChaosError)` if any table could not be read
async fn expected_relationships(state: &AppState) -> Result<HashSet<StoredKey>, ChaosError> {
    let mut expected = HashSet::new();
    let mut transaction = state.db.begin().await?;
    // Must be the first statement in the transaction to take effect.
    sqlx::query("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ")
        .execute(&mut *transaction)
        .await?;

    for table in REPLICATED_TABLES {
        // `to_jsonb` gives the row in the same shape Sequin delivers, so the
        // shared mapping reads identical columns either way. The table name is
        // interpolated because the list of tables is a compile-time constant,
        // not request input, so there is nothing to inject.
        let sql = sqlx::AssertSqlSafe(format!("SELECT to_jsonb({table}) FROM {table}"));
        let rows: Vec<Value> = sqlx::query_scalar(sql).fetch_all(&mut *transaction).await?;

        for row in &rows {
            for (key, _) in relationships_for_row(table, row, Operation::Touch) {
                expected.insert(to_stored_key(key));
            }
        }
    }

    // Read-only, so there is nothing to commit.
    transaction.rollback().await?;

    Ok(expected)
}

/// Converts a SpiceDB relationship into a comparable key.
///
/// Returns `None` for a relationship the Chaos application does not own, which
/// is any type outside [`MANAGED_RESOURCE_TYPES`] or any ID that is not an
/// integer. Skipping rather than failing keeps the sweep from ever considering a
/// relationship it did not write.
fn rel_key_of(relationship: &Relationship) -> Option<StoredKey> {
    let resource = relationship.resource.as_ref()?;
    let subject = relationship.subject.as_ref()?.object.as_ref()?;

    let resource_type = resource.object_type.as_str();
    let subject_type = subject.object_type.as_str();
    if !MANAGED_RESOURCE_TYPES.contains(&resource_type)
        || !MANAGED_RESOURCE_TYPES.contains(&subject_type)
    {
        return None;
    }

    Some((
        resource_type.to_owned(),
        resource.object_id.parse().ok()?,
        relationship.relation.clone(),
        subject_type.to_owned(),
        subject.object_id.parse().ok()?,
    ))
}

/// Reads every managed relationship currently held by SpiceDB.
///
/// # Arguments
///
/// * `state` - The application state, holding the SpiceDB client and key
///
/// # Returns
///
/// * `Ok(Vec<Relationship>)` across all managed resource types
/// * `Err(ChaosError)` if any read fails
async fn stored_relationships(state: &AppState) -> Result<Vec<Relationship>, ChaosError> {
    let mut all = Vec::new();

    for resource_type in MANAGED_RESOURCE_TYPES {
        all.extend(
            read_relationships_of_type(
                &state.spicedb,
                &state.spicedb_key,
                &state.spicedb_zedtoken,
                resource_type,
            )
            .await?,
        );
    }

    Ok(all)
}

/// Runs one reconciliation pass.
///
/// # Arguments
///
/// * `state` - The application state
///
/// # Returns
///
/// * `Ok(Report)` describing what was found
/// * `Err(ChaosError)` if the run could not complete; in that case nothing was
///   deleted
pub async fn run_once(state: &AppState) -> Result<Report, ChaosError> {
    // SpiceDB is read *before* Postgres, and that order is what makes deletion
    // safe. A relationship created after the SpiceDB read is absent from
    // `stored`, so it can only ever count as missing. Reading Postgres first
    // would invert this: a row committed between the two reads would appear in
    // `stored` but not in `expected`, be reported as an orphan, and get deleted,
    // stripping live access. With this order a relationship in `stored` and not
    // in `expected` is either a true orphan or a row deleted after the read, and
    // deleting it is correct either way.
    let stored = stored_relationships(state).await?;
    // Built in full before any SpiceDB write; any Postgres error aborts the run.
    // See `expected_relationships` for why a partial expected set is dangerous.
    let expected = expected_relationships(state).await?;

    let mut report = Report::default();
    let mut seen: HashSet<StoredKey> = HashSet::new();

    for relationship in &stored {
        let Some(key) = rel_key_of(relationship) else {
            continue;
        };
        // SpiceDB cannot hold the same relationship twice, but a defensive
        // de-dupe keeps a duplicate from becoming two deletes in one batch,
        // which would trip ERROR_REASON_UPDATES_ON_SAME_RELATIONSHIP.
        if !seen.insert(key.clone()) {
            continue;
        }
        if expected.contains(&key) {
            report.matched += 1;
        } else {
            report.orphans.push(relationship.clone());
        }
    }
    report.missing = expected.len().saturating_sub(report.matched);

    if report.orphans.is_empty() {
        return Ok(report);
    }

    if !env_flag("RECONCILE_DELETE") {
        log::warn!(
            "Reconcile: {} orphaned relationship(s) found but RECONCILE_DELETE is not set, so \
             nothing was removed. Set it to repair, or inspect the console log above for them.",
            report.orphans.len()
        );
        return Ok(report);
    }

    // One relationship per key, so the batch cannot trip
    // ERROR_REASON_UPDATES_ON_SAME_RELATIONSHIP. Chunked because SpiceDB caps a
    // single WriteRelationships batch.
    for chunk in report.orphans.chunks(500) {
        let updates: Vec<_> = chunk.iter().map(delete_relationship).collect();
        let token = write_relationships(&state.spicedb, &state.spicedb_key, updates).await?;
        publish_token(state, token);
    }
    report.deleted = true;

    Ok(report)
}

/// Asks Sequin to re-deliver every current row to the webhook.
///
/// A backfill arrives as `read` messages, which the webhook already handles the
/// same as an insert, so this repairs relationships that are missing. It cannot
/// remove orphans, which is why `run_once` also diffs directly.
///
/// # Arguments
///
/// * `state` - The application state, holding the HTTP client
///
/// # Returns
///
/// * `Ok(())` if Sequin accepted the request
/// * `Err(ChaosError)` if the request failed
pub async fn request_backfill(state: &AppState) -> Result<(), ChaosError> {
    let base = std::env::var("SEQUIN_URL")
        .unwrap_or_else(|_| "http://sequin:7376".to_owned())
        .trim_end_matches('/')
        .to_owned();
    let token = std::env::var("SEQUIN_API_TOKEN").map_err(|error| {
        ChaosError::InternalServerErrorWithMessage(format!(
            "SEQUIN_API_TOKEN must be set to trigger a reconciliation backfill: {error:?}"
        ))
    })?;

    let response = state
        .ctx
        .post(format!("{base}/api/sinks/{SINK_NAME}/backfills"))
        .bearer_auth(token)
        .send()
        .await?;

    if !response.status().is_success() {
        return Err(ChaosError::InternalServerErrorWithMessage(format!(
            "Sequin rejected the backfill request: {}",
            response.status()
        )));
    }

    Ok(())
}

/// Runs reconciliation on an interval, on one replica at a time.
///
/// Every replica spawns this, but only the one holding the advisory lock does any
/// work; the others sleep. The lock is held for the duration of a run, so a slow
/// pass does not get overlapped by the next tick elsewhere.
///
/// # Arguments
///
/// * `state` - The application state, cloned per task
///
/// # Returns
///
/// Never returns; runs until the process exits
pub async fn spawn_reconciler(state: AppState) {
    if !env_flag("RECONCILE_ENABLED") {
        log::info!("Reconcile: disabled (set RECONCILE_ENABLED=true to enable)");
        return;
    }

    let interval = Duration::from_secs(env_secs("RECONCILE_INTERVAL_SECS", DEFAULT_INTERVAL_SECS));
    let lock = PgAdvisoryLock::with_key(PgAdvisoryLockKey::BigInt(RECONCILE_LOCK_KEY));

    loop {
        tokio::time::sleep(interval).await;

        let conn = match state.db.acquire().await {
            Ok(conn) => conn,
            Err(error) => {
                log::error!("Reconcile: could not check out a connection: {error}");
                continue;
            }
        };

        // The guard queues pg_advisory_unlock() on drop, which sqlx flushes when
        // the connection returns to the pool. Holding the raw connection would
        // leak the lock, because a pooled session outlives the lock scope.
        let guard = match lock.try_acquire(conn).await {
            Ok(Either::Left(guard)) => guard,
            // Another replica is reconciling; skip this tick.
            Ok(Either::Right(_conn)) => continue,
            Err(error) => {
                log::error!("Reconcile: leadership check failed: {error}");
                continue;
            }
        };

        if let Err(error) = request_backfill(&state).await {
            log::warn!("Reconcile: could not trigger a Sequin backfill: {error:?}");
        }

        match run_once(&state).await {
            Ok(report) => log::info!(
                "Reconcile: {} matched, {} missing (backfill repairs), {} orphaned{}, deleted={}",
                report.matched,
                report.missing,
                report.orphans.len(),
                if report.deleted { "" } else { " (not removed)" },
                report.deleted,
            ),
            // Nothing was deleted, because the expected set is built in full
            // before any write.
            Err(error) => log::error!("Reconcile: run failed, nothing was deleted: {error:?}"),
        }

        drop(guard);
    }
}
