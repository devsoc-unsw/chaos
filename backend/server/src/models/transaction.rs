//! Database transaction handling for Chaos.
//!
//! This module provides functionality for managing database transactions
//! in a type-safe way, with integration into the Axum web framework.

use crate::models::app::AppState;
use crate::models::error::ChaosError;
use crate::spicedb::authzed::api::v1::{
    permissions_service_client::PermissionsServiceClient, relationship_update::Operation,
    RelationshipUpdate,
};
use crate::spicedb::{invert_relationship_update, new_relationship_update, write_relationships};
use axum::async_trait;
use axum::extract::{FromRef, FromRequestParts};
use axum::http::request::Parts;
use sqlx::{Postgres, Transaction};
use tonic::transport::Channel;

/// A wrapper around a PostgreSQL transaction.
///
/// This struct provides a type-safe way to handle database transactions
/// in request handlers. It automatically begins a transaction when extracted
/// from a request.
///
/// SpiceDB relationship writes can be queued on the transaction with
/// [`DBTransaction::create_relationship`] and [`DBTransaction::delete_relationship`].
/// Because SpiceDB has no transactions or rollbacks, the writes are buffered
/// in memory and only applied by [`DBTransaction::commit`], which keeps the two
/// systems as consistent as possible (see its documentation).
pub struct DBTransaction<'a> {
    /// The underlying PostgreSQL transaction
    pub tx: Transaction<'a, Postgres>,

    /// Shared SpiceDB client used to flush queued relationship writes on commit.
    spicedb: PermissionsServiceClient<Channel>,

    /// Bearer key attached to SpiceDB requests made on commit.
    spicedb_key: String,

    /// SpiceDB relationship writes queued for application on commit.
    queued_relationship_updates: Vec<RelationshipUpdate>,
}

impl DBTransaction<'_> {
    /// Queues the creation of a SpiceDB relationship, applied by
    /// [`DBTransaction::commit`].
    ///
    /// The relationship is `<resource_type>:<resource_id>#<relation>@<subject_type>:<subject_id>`,
    /// e.g. `chaos/campaign:123#organisation@chaos/organisation:5`. Note that
    /// creating a relationship that already exists fails the eventual commit.
    ///
    /// # Arguments
    ///
    /// * `resource_type` - SpiceDB object type of the resource, such as `chaos/campaign`
    /// * `resource_id` - Chaos ID of the resource
    /// * `relation` - SpiceDB relation on the resource, such as `organisation`
    /// * `subject_type` - SpiceDB object type of the subject, such as `chaos/user`
    /// * `subject_id` - Chaos ID of the subject
    pub fn create_relationship(
        &mut self,
        resource_type: &str,
        resource_id: i64,
        relation: &str,
        subject_type: &str,
        subject_id: i64,
    ) {
        self.queued_relationship_updates
            .push(new_relationship_update(
                Operation::Create,
                resource_type,
                resource_id,
                relation,
                subject_type,
                subject_id,
            ));
    }

    /// Queues the deletion of a SpiceDB relationship, applied by
    /// [`DBTransaction::commit`].
    ///
    /// The relationship is `<resource_type>:<resource_id>#<relation>@<subject_type>:<subject_id>`,
    /// e.g. `chaos/organisation:5#member@chaos/user:42`. Note that deleting a
    /// relationship that does not exist fails the eventual commit.
    ///
    /// # Arguments
    ///
    /// * `resource_type` - SpiceDB object type of the resource, such as `chaos/organisation`
    /// * `resource_id` - Chaos ID of the resource
    /// * `relation` - SpiceDB relation on the resource, such as `member`
    /// * `subject_type` - SpiceDB object type of the subject, such as `chaos/user`
    /// * `subject_id` - Chaos ID of the subject
    pub fn delete_relationship(
        &mut self,
        resource_type: &str,
        resource_id: i64,
        relation: &str,
        subject_type: &str,
        subject_id: i64,
    ) {
        self.queued_relationship_updates
            .push(new_relationship_update(
                Operation::Delete,
                resource_type,
                resource_id,
                relation,
                subject_type,
                subject_id,
            ));
    }

    /// Commits the transaction and the queued SpiceDB relationship writes.
    ///
    /// Postgres and SpiceDB cannot commit atomically, so the commit is
    /// ordered to fail in the safest direction:
    ///
    /// 1. The queued SpiceDB writes are applied as a single atomic batch. If
    ///    this fails, the Postgres transaction is dropped without committing,
    ///    so neither system changes.
    /// 2. The Postgres transaction is committed. If this fails, best-effort
    ///    compensation writes the inverse relationship updates to SpiceDB, so
    ///    the net effect is that neither system changes.
    ///
    /// Step 2 failing *and* the compensation also failing leaves SpiceDB
    /// ahead of Postgres; this residual risk is inherent to dual writes and
    /// must be handled by reconciliation, with Postgres as the source of
    /// truth.
    ///
    /// # Returns
    ///
    /// * `Ok(())` if both systems were updated
    /// * `Err(ChaosError)` if either system failed to commit
    pub async fn commit(self) -> Result<(), ChaosError> {
        if self.queued_relationship_updates.is_empty() {
            self.tx.commit().await?;
            return Ok(());
        }

        let inverse_updates = self
            .queued_relationship_updates
            .iter()
            .filter_map(invert_relationship_update)
            .collect();

        write_relationships(
            &self.spicedb,
            &self.spicedb_key,
            self.queued_relationship_updates,
        )
        .await?;

        if let Err(error) = self.tx.commit().await {
            if let Err(compensation_error) =
                write_relationships(&self.spicedb, &self.spicedb_key, inverse_updates).await
            {
                println!(
                    "Failed to compensate SpiceDB writes after Postgres commit failure: \
                     {compensation_error:?}"
                );
            }
            return Err(error.into());
        }

        Ok(())
    }
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
            spicedb: app_state.spicedb.clone(),
            spicedb_key: app_state.spicedb_key.clone(),
            queued_relationship_updates: Vec::new(),
        })
    }
}
