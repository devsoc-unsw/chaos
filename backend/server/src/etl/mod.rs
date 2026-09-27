use crate::spicedb::authzed::api::v1::permissions_service_client::PermissionsServiceClient;
use crate::spicedb::authzed::api::v1::relationship_update::Operation;
use crate::spicedb::authzed::api::v1::RelationshipUpdate;
use crate::spicedb::schema::{relation, resource, PLATFORM_RESOURCE_ID};
use crate::spicedb::{
    delete_all_resource_relationships, new_relationship_update, write_relationships,
};
use etl::config::{
    BatchConfig, InvalidatedSlotBehavior, MemoryBackpressureConfig, PgConnectionConfig,
    PipelineConfig, TableSyncCopyConfig, TcpKeepaliveConfig, TlsConfig,
};
use etl::data::{Cell, OldTableRow, TableRow, UpdatedTableRow};
use etl::destination::{
    Destination, DestinationWriteStatus, DropTableForCopyResult, TableCopyBatchId,
    WriteEventsDurability, WriteEventsResult, WriteTableRowsResult,
};
use etl::error::EtlResult;
use etl::etl_error;
use etl::event::Event;
use etl::pipeline::Pipeline;
use etl::schema::ReplicatedTableSchema;
use etl::store::PostgresStore;
use etl_config::shared::ReplicationSlotConfig;
use secrecy::SecretString;
use std::collections::HashMap;
use std::future::Future;
use tonic::transport::Channel;

/// ETL destination that syncs Postgres changes into SpiceDB relationships
#[derive(Clone)]
pub struct SpiceDBDestination {
    spicedb_client: PermissionsServiceClient<Channel>,
    spicedb_key: String,
}

impl SpiceDBDestination {
    /// Creates a destination sharing the given SpiceDB client and key.
    pub fn new(spicedb_client: PermissionsServiceClient<Channel>, spicedb_key: String) -> Self {
        Self {
            spicedb_client,
            spicedb_key,
        }
    }
}

/// Returns replicated column names in tuple order, matching [`TableRow`] values.
fn full_column_names(schema: &ReplicatedTableSchema) -> Vec<String> {
    schema.column_schemas().map(|c| c.name.clone()).collect()
}

/// Returns replica-identity column names in key-tuple order.
///
/// Key rows ([`OldTableRow::Key`]) are packed densely with identity columns
/// only, so they need these names rather than the full column list
fn identity_column_names(schema: &ReplicatedTableSchema) -> Vec<String> {
    schema
        .identity_column_schemas()
        .map(|c| c.name.clone())
        .collect()
}

/// Indexes a row's cells by column name.
fn row_map<'a>(names: &'a [String], cells: &'a [Cell]) -> HashMap<&'a str, &'a Cell> {
    names.iter().map(String::as_str).zip(cells.iter()).collect()
}

/// Extracts an `i64` (Postgres `BIGINT`, e.g. Chaos IDs) from a mapped row.
fn cell_i64(row: &HashMap<&str, &Cell>, col: &str) -> Option<i64> {
    match row.get(col)? {
        Cell::I64(v) => Some(*v),
        _ => None,
    }
}

/// Extracts text (Postgres enums arrive as [`Cell::String`]) from a mapped row.
fn cell_str<'a>(row: &'a HashMap<&str, &'a Cell>, col: &str) -> Option<&'a str> {
    match row.get(col)? {
        Cell::String(s) => Some(s.as_str()),
        _ => None,
    }
}

/// Builds an idempotent upsert for a SpiceDB relationship.
///
/// Touch (not Create) is what makes replayed batches converge instead of
/// failing the whole batch with `ATTEMPT_TO_RECREATE_RELATIONSHIP`.
fn touch(
    resource_type: &str,
    resource_id: i64,
    relation: &str,
    subject_type: &str,
    subject_id: i64,
) -> RelationshipUpdate {
    new_relationship_update(
        Operation::Touch,
        resource_type,
        resource_id,
        relation,
        subject_type,
        subject_id,
    )
}

/// Builds a single-relationship delete.
fn delete(
    resource_type: &str,
    resource_id: i64,
    relation: &str,
    subject_type: &str,
    subject_id: i64,
) -> RelationshipUpdate {
    new_relationship_update(
        Operation::Delete,
        resource_type,
        resource_id,
        relation,
        subject_type,
        subject_id,
    )
}

/// Maps an inserted (or backfilled) row to the SpiceDB relationships it owns.
///
/// Returns an empty vec when required columns are missing/null or the table
/// owns no relationships (association tables, invites, tokens, …).
fn touches_for_row(table: &str, row: &HashMap<&str, &Cell>) -> Vec<RelationshipUpdate> {
    match table {
        "users" => {
            let (Some(id), Some(role)) = (cell_i64(row, "id"), cell_str(row, "role")) else {
                return vec![];
            };
            let rel = if role == "SuperUser" {
                relation::platform::SUPERUSER
            } else {
                relation::platform::USER
            };
            vec![touch(
                resource::PLATFORM,
                PLATFORM_RESOURCE_ID,
                rel,
                resource::USER,
                id,
            )]
        }
        "organisations" => {
            let Some(id) = cell_i64(row, "id") else {
                return vec![];
            };
            vec![touch(
                resource::ORGANISATION,
                id,
                relation::organisation::PLATFORM,
                resource::PLATFORM,
                PLATFORM_RESOURCE_ID,
            )]
        }
        "organisation_members" => {
            let (Some(oid), Some(uid), Some(role)) = (
                cell_i64(row, "organisation_id"),
                cell_i64(row, "user_id"),
                cell_str(row, "role"),
            ) else {
                return vec![];
            };
            let rel = if role == "Admin" {
                relation::organisation::ADMIN
            } else {
                relation::organisation::MEMBER
            };
            vec![touch(resource::ORGANISATION, oid, rel, resource::USER, uid)]
        }
        "campaigns" => {
            let (Some(id), Some(oid)) = (cell_i64(row, "id"), cell_i64(row, "organisation_id"))
            else {
                return vec![];
            };
            vec![touch(
                resource::CAMPAIGN,
                id,
                relation::campaign::ORGANISATION,
                resource::ORGANISATION,
                oid,
            )]
        }
        "campaign_roles" => {
            let (Some(id), Some(cid)) = (cell_i64(row, "id"), cell_i64(row, "campaign_id")) else {
                return vec![];
            };
            vec![touch(
                resource::CAMPAIGN_ROLE,
                id,
                relation::campaign_role::CAMPAIGN,
                resource::CAMPAIGN,
                cid,
            )]
        }
        "applications" => {
            let (Some(id), Some(cid), Some(uid)) = (
                cell_i64(row, "id"),
                cell_i64(row, "campaign_id"),
                cell_i64(row, "user_id"),
            ) else {
                return vec![];
            };
            vec![
                touch(
                    resource::APPLICATION,
                    id,
                    relation::application::CAMPAIGN,
                    resource::CAMPAIGN,
                    cid,
                ),
                touch(
                    resource::APPLICATION,
                    id,
                    relation::application::CREATOR,
                    resource::USER,
                    uid,
                ),
            ]
        }
        "questions" => {
            let (Some(id), Some(cid)) = (cell_i64(row, "id"), cell_i64(row, "campaign_id")) else {
                return vec![];
            };
            vec![touch(
                resource::QUESTION,
                id,
                relation::question::CAMPAIGN,
                resource::CAMPAIGN,
                cid,
            )]
        }
        "campaign_rating_categories" => {
            let (Some(id), Some(cid)) = (cell_i64(row, "id"), cell_i64(row, "campaign_id")) else {
                return vec![];
            };
            vec![touch(
                resource::RATING_CATEGORY,
                id,
                relation::rating_category::CAMPAIGN,
                resource::CAMPAIGN,
                cid,
            )]
        }
        "application_ratings" => {
            let (Some(id), Some(aid), Some(rid)) = (
                cell_i64(row, "id"),
                cell_i64(row, "application_id"),
                cell_i64(row, "rater_id"),
            ) else {
                return vec![];
            };
            vec![
                touch(
                    resource::RATING,
                    id,
                    relation::rating::APPLICATION,
                    resource::APPLICATION,
                    aid,
                ),
                touch(
                    resource::RATING,
                    id,
                    relation::rating::CREATOR,
                    resource::USER,
                    rid,
                ),
            ]
        }
        "application_rating_category_ratings" => {
            let (Some(id), Some(rid)) =
                (cell_i64(row, "id"), cell_i64(row, "application_rating_id"))
            else {
                return vec![];
            };
            vec![touch(
                resource::CATEGORY_RATING,
                id,
                relation::category_rating::RATING,
                resource::RATING,
                rid,
            )]
        }
        "comments" => {
            let (Some(id), Some(aid), Some(uid)) = (
                cell_i64(row, "id"),
                cell_i64(row, "application_id"),
                cell_i64(row, "author_id"),
            ) else {
                return vec![];
            };
            vec![
                touch(
                    resource::COMMENT,
                    id,
                    relation::comment::APPLICATION,
                    resource::APPLICATION,
                    aid,
                ),
                touch(
                    resource::COMMENT,
                    id,
                    relation::comment::CREATOR,
                    resource::USER,
                    uid,
                ),
            ]
        }
        "answers" => {
            let (Some(id), Some(aid)) = (cell_i64(row, "id"), cell_i64(row, "application_id"))
            else {
                return vec![];
            };
            vec![touch(
                resource::ANSWER,
                id,
                relation::answer::APPLICATION,
                resource::APPLICATION,
                aid,
            )]
        }
        "offers" => {
            let (Some(id), Some(cid), Some(aid)) = (
                cell_i64(row, "id"),
                cell_i64(row, "campaign_id"),
                cell_i64(row, "application_id"),
            ) else {
                return vec![];
            };
            vec![
                touch(
                    resource::OFFER,
                    id,
                    relation::offer::CAMPAIGN,
                    resource::CAMPAIGN,
                    cid,
                ),
                touch(
                    resource::OFFER,
                    id,
                    relation::offer::APPLICATION,
                    resource::APPLICATION,
                    aid,
                ),
            ]
        }
        "email_templates" => {
            let (Some(id), Some(oid)) = (cell_i64(row, "id"), cell_i64(row, "organisation_id"))
            else {
                return vec![];
            };
            vec![touch(
                resource::EMAIL_TEMPLATE,
                id,
                relation::email_template::ORGANISATION,
                resource::ORGANISATION,
                oid,
            )]
        }
        _ => vec![],
    }
}

/// Returns the SpiceDB resource type owned by a table, if any.
///
/// `organisation_members` is absent on purpose: a membership row owns no
/// resource, it only contributes a relation on its organisation.
fn resource_for_table(table: &str) -> Option<&'static str> {
    match table {
        "users" => Some(resource::USER),
        "organisations" => Some(resource::ORGANISATION),
        "campaigns" => Some(resource::CAMPAIGN),
        "campaign_roles" => Some(resource::CAMPAIGN_ROLE),
        "applications" => Some(resource::APPLICATION),
        "questions" => Some(resource::QUESTION),
        "campaign_rating_categories" => Some(resource::RATING_CATEGORY),
        "application_ratings" => Some(resource::RATING),
        "application_rating_category_ratings" => Some(resource::CATEGORY_RATING),
        "comments" => Some(resource::COMMENT),
        "answers" => Some(resource::ANSWER),
        "offers" => Some(resource::OFFER),
        "email_templates" => Some(resource::EMAIL_TEMPLATE),
        _ => None,
    }
}

impl Destination for SpiceDBDestination {
    fn name() -> &'static str {
        "SpiceDB"
    }

    /// No destination objects exist to drop before a table copy.
    ///
    /// Touch upserts converge on re-copy, so restarting a copy needs no
    /// cleanup; just acknowledge.
    fn drop_table_for_copy(
        &self,
        _replicated_table_schema: &ReplicatedTableSchema,
        async_result: DropTableForCopyResult<()>,
    ) -> impl Future<Output = EtlResult<()>> + Send {
        async move {
            async_result.send(Ok(()));
            Ok(())
        }
    }

    /// Applies backfilled rows from initial sync as idempotent touches.
    ///
    /// This is the backfill path: every existing row converges into SpiceDB,
    /// so a fresh pipeline heals drift and covers the seeder without any
    /// special-casing.
    fn write_table_rows(
        &self,
        replicated_table_schema: &ReplicatedTableSchema,
        _batch_id: Option<TableCopyBatchId>,
        table_rows: Vec<TableRow>,
        async_result: WriteTableRowsResult,
    ) -> impl Future<Output = EtlResult<()>> + Send {
        async move {
            // Empty batch: table has no rows, nothing to converge.
            if table_rows.is_empty() {
                async_result.send(Ok(DestinationWriteStatus::Durable));
                return Ok(());
            }
            let table = replicated_table_schema.name().name.as_str();
            let names = full_column_names(replicated_table_schema);
            let touches: Vec<RelationshipUpdate> = table_rows
                .iter()
                .flat_map(|r| touches_for_row(table, &row_map(&names, r.values())))
                .collect();
            if touches.is_empty() {
                async_result.send(Ok(DestinationWriteStatus::Durable));
                return Ok(());
            }
            // SpiceDB caps a single WriteRelationships batch, so chunk large
            // backfills; any chunk failing nacks the whole batch for retry.
            for chunk in touches.chunks(500) {
                if let Err(e) =
                    write_relationships(&self.spicedb_client, &self.spicedb_key, chunk.to_vec())
                        .await
                {
                    log::error!("SpiceDBDestination: backfill batch for {table} failed: {e:?}");
                    async_result.send(Err(etl_error!(
                        etl::error::ErrorKind::Unknown,
                        "SpiceDB write failed"
                    )));
                    return Ok(());
                }
            }
            async_result.send(Ok(DestinationWriteStatus::Durable));
            Ok(())
        }
    }

    fn write_events(
        &self,
        events: Vec<Event>,
        _durability: WriteEventsDurability,
        async_result: WriteEventsResult,
    ) -> impl Future<Output = EtlResult<()>> + Send {
        async move {
            if events.is_empty() {
                async_result.send(Ok(DestinationWriteStatus::Durable));
                return Ok(());
            }
            // Batched Touch/Delete ops applied atomically first.
            let mut touches: Vec<RelationshipUpdate> = Vec::new();
            // (resource_type, id) pairs for filtered resource deletes.
            let mut resource_deletes: Vec<(&'static str, i64)> = Vec::new();
            // Membership deletes whose role is unknown (key-only old row):
            // tried as admin-then-member sequentially below.
            let mut unknown_member_deletes: Vec<(i64, i64)> = Vec::new();
            // Opposite-relation cleanup after role swaps; best-effort.
            let mut best_effort: Vec<RelationshipUpdate> = Vec::new();

            for event in &events {
                match event {
                    Event::Insert(i) => {
                        let table = i.replicated_table_schema.name().name.as_str();
                        let names = full_column_names(&i.replicated_table_schema);
                        touches.extend(touches_for_row(
                            table,
                            &row_map(&names, i.table_row.values()),
                        ));
                    }
                    Event::Update(u) => {
                        let table = u.replicated_table_schema.name().name.as_str();
                        // Needed columns (ids, FKs, roles) are never toasted,
                        // so a partial image missing them is unusable; skip it.
                        let UpdatedTableRow::Full(new_row) = &u.updated_table_row else {
                            log::warn!("SpiceDBDestination: skipping partial update for {table}");
                            continue;
                        };
                        let names = full_column_names(&u.replicated_table_schema);
                        let new_map = row_map(&names, new_row.values());
                        match table {
                            "users" => {
                                let (Some(id), Some(new_role)) =
                                    (cell_i64(&new_map, "id"), cell_str(&new_map, "role"))
                                else {
                                    continue;
                                };
                                if let Some(OldTableRow::Full(old)) = &u.old_table_row {
                                    let old_map = row_map(&names, old.values());
                                    if cell_str(&old_map, "role") == Some(new_role) {
                                        continue;
                                    }
                                }
                                let (new_rel, old_rel) = if new_role == "SuperUser" {
                                    (relation::platform::SUPERUSER, relation::platform::USER)
                                } else {
                                    (relation::platform::USER, relation::platform::SUPERUSER)
                                };
                                touches.push(touch(
                                    resource::PLATFORM,
                                    PLATFORM_RESOURCE_ID,
                                    new_rel,
                                    resource::USER,
                                    id,
                                ));
                                best_effort.push(delete(
                                    resource::PLATFORM,
                                    PLATFORM_RESOURCE_ID,
                                    old_rel,
                                    resource::USER,
                                    id,
                                ));
                            }
                            "organisation_members" => {
                                let (Some(oid), Some(uid), Some(new_role)) = (
                                    cell_i64(&new_map, "organisation_id"),
                                    cell_i64(&new_map, "user_id"),
                                    cell_str(&new_map, "role"),
                                ) else {
                                    continue;
                                };
                                let new_rel = if new_role == "Admin" {
                                    relation::organisation::ADMIN
                                } else {
                                    relation::organisation::MEMBER
                                };
                                if let Some(OldTableRow::Full(old)) = &u.old_table_row {
                                    let old_map = row_map(&names, old.values());
                                    if cell_str(&old_map, "role") == Some(new_role) {
                                        continue;
                                    }
                                    let old_rel = if cell_str(&old_map, "role") == Some("Admin") {
                                        relation::organisation::ADMIN
                                    } else {
                                        relation::organisation::MEMBER
                                    };
                                    if old_rel != new_rel {
                                        touches.push(delete(
                                            resource::ORGANISATION,
                                            oid,
                                            old_rel,
                                            resource::USER,
                                            uid,
                                        ));
                                    }
                                } else {
                                    let old_rel = if new_rel == relation::organisation::ADMIN {
                                        relation::organisation::MEMBER
                                    } else {
                                        relation::organisation::ADMIN
                                    };
                                    best_effort.push(delete(
                                        resource::ORGANISATION,
                                        oid,
                                        old_rel,
                                        resource::USER,
                                        uid,
                                    ));
                                }
                                touches.push(touch(
                                    resource::ORGANISATION,
                                    oid,
                                    new_rel,
                                    resource::USER,
                                    uid,
                                ));
                            }
                            _ => {}
                        }
                    }
                    Event::Delete(d) => {
                        let table = d.replicated_table_schema.name().name.as_str();
                        let Some(old) = &d.old_table_row else {
                            log::warn!("SpiceDBDestination: delete with no old row for {table}");
                            continue;
                        };
                        if table == "organisation_members" {
                            let (names, cells) = match old {
                                OldTableRow::Full(r) => {
                                    (full_column_names(&d.replicated_table_schema), r.values())
                                }
                                OldTableRow::Key(r) => (
                                    identity_column_names(&d.replicated_table_schema),
                                    r.values(),
                                ),
                            };
                            let map = row_map(&names, cells);
                            let (Some(oid), Some(uid)) =
                                (cell_i64(&map, "organisation_id"), cell_i64(&map, "user_id"))
                            else {
                                continue;
                            };
                            match cell_str(&map, "role") {
                                Some("Admin") => touches.push(delete(
                                    resource::ORGANISATION,
                                    oid,
                                    relation::organisation::ADMIN,
                                    resource::USER,
                                    uid,
                                )),
                                Some(_) => touches.push(delete(
                                    resource::ORGANISATION,
                                    oid,
                                    relation::organisation::MEMBER,
                                    resource::USER,
                                    uid,
                                )),
                                None => unknown_member_deletes.push((oid, uid)),
                            }
                            continue;
                        }
                        let Some(res_type) = resource_for_table(table) else {
                            continue;
                        };
                        let (names, cells) = match old {
                            OldTableRow::Full(r) => {
                                (full_column_names(&d.replicated_table_schema), r.values())
                            }
                            OldTableRow::Key(r) => (
                                identity_column_names(&d.replicated_table_schema),
                                r.values(),
                            ),
                        };
                        let map = row_map(&names, cells);
                        let Some(id) = cell_i64(&map, "id") else {
                            log::warn!("SpiceDBDestination: delete with no id for {table}");
                            continue;
                        };
                        resource_deletes.push((res_type, id));
                    }
                    // Begin/Commit are transaction markers (duplicable under
                    // parallel sync; not ordering-relevant here), Relation is a
                    // schema barrier with no row payload, truncates never occur
                    // (cascades arrive as deletes), Unsupported carries nothing.
                    _ => {}
                }
            }

            if !touches.is_empty() {
                if let Err(e) =
                    write_relationships(&self.spicedb_client, &self.spicedb_key, touches).await
                {
                    log::error!("SpiceDBDestination: event batch write failed: {e:?}");
                    async_result.send(Err(etl_error!(
                        etl::error::ErrorKind::Unknown,
                        "SpiceDB write failed"
                    )));
                    return Ok(());
                }
            }
            // Key-only membership deletes: the role isn't in the identity
            // image, so try admin first, then member. Both failing nacks the
            // batch; under REPLICA IDENTITY FULL this path is unreachable.
            for (oid, uid) in unknown_member_deletes {
                let admin = delete(
                    resource::ORGANISATION,
                    oid,
                    relation::organisation::ADMIN,
                    resource::USER,
                    uid,
                );
                if write_relationships(&self.spicedb_client, &self.spicedb_key, vec![admin])
                    .await
                    .is_err()
                {
                    let member = delete(
                        resource::ORGANISATION,
                        oid,
                        relation::organisation::MEMBER,
                        resource::USER,
                        uid,
                    );
                    if let Err(e) =
                        write_relationships(&self.spicedb_client, &self.spicedb_key, vec![member])
                            .await
                    {
                        log::error!(
                            "SpiceDBDestination: membership delete failed for org {oid} user {uid}: {e:?}"
                        );
                        async_result.send(Err(etl_error!(
                            etl::error::ErrorKind::Unknown,
                            "SpiceDB write failed"
                        )));
                        return Ok(());
                    }
                }
            }
            // Filtered deletes are idempotent, so retries converge.
            for (res_type, id) in resource_deletes {
                if let Err(e) = delete_all_resource_relationships(
                    &self.spicedb_client,
                    &self.spicedb_key,
                    res_type,
                    id,
                )
                .await
                {
                    log::error!(
                        "SpiceDBDestination: resource delete failed for {res_type}:{id}: {e:?}"
                    );
                    async_result.send(Err(etl_error!(
                        etl::error::ErrorKind::Unknown,
                        "SpiceDB delete failed"
                    )));
                    return Ok(());
                }
            }
            // Opposite-relation cleanup after role swaps; a missing relation
            // just means state already converged.
            for op in best_effort {
                if let Err(e) =
                    write_relationships(&self.spicedb_client, &self.spicedb_key, vec![op]).await
                {
                    log::warn!("SpiceDBDestination: opposite-relation cleanup skipped: {e:?}");
                }
            }
            async_result.send(Ok(DestinationWriteStatus::Durable));
            Ok(())
        }
    }
}

/// Pipeline ID for the Postgres → SpiceDB sync pipeline.
///
/// Selects the replication slot (`supabase_etl_apply_1`) and the state-store
/// namespace. Must stay stable per database: changing it orphans the old slot
/// and triggers a full re-copy.
const PIPELINE_ID: u64 = 1;

/// Publication the pipeline replicates, created by migration `20260922092514_cdc`.
const PUBLICATION_NAME: &str = "spicedb_sync";

/// Returns true when the ETL pipeline should run.
///
/// Opt-in via `ETL_ENABLED=true` so environments without `wal_level=logical`
/// (or without the publication) boot normally.
pub fn enabled() -> bool {
    matches!(std::env::var("ETL_ENABLED").as_deref(), Ok("true"))
}

/// Builds the ETL source connection from `DATABASE_URL`.
///
/// # Returns
///
/// * `Ok(PgConnectionConfig)` parsed from `DATABASE_URL`
/// * `Err(ChaosError)` if the variable is missing or unparsable
fn pg_connection() -> Result<PgConnectionConfig, crate::models::error::ChaosError> {
    use crate::models::error::ChaosError;

    let db_url = std::env::var("DATABASE_URL").map_err(|e| {
        ChaosError::InternalServerErrorWithMessage(format!("ETL needs DATABASE_URL: {e:?}"))
    })?;
    // sqlx 0.9 deliberately exposes no password getter, so parse the URL
    // directly (`url` already decodes percent-escapes in each component).
    let url = url::Url::parse(&db_url).map_err(|e| {
        ChaosError::InternalServerErrorWithMessage(format!("ETL invalid DATABASE_URL: {e:?}"))
    })?;
    let host = url.host_str().ok_or_else(|| {
        ChaosError::InternalServerErrorWithMessage("ETL DATABASE_URL has no host".to_owned())
    })?;
    let name = url.path().trim_start_matches('/').to_owned();
    if name.is_empty() {
        return Err(ChaosError::InternalServerErrorWithMessage(
            "ETL DATABASE_URL has no database".to_owned(),
        ));
    }

    Ok(PgConnectionConfig {
        host: host.to_owned(),
        hostaddr: None,
        port: url.port().unwrap_or(5432),
        name,
        username: url.username().to_owned(),
        password: url.password().map(SecretString::from),
        tls: TlsConfig::disabled(),
        keepalive: TcpKeepaliveConfig::default(),
    })
}

/// Starts the Postgres → SpiceDB pipeline with durable Postgres-backed state.
///
/// Checkpoints live in [`PostgresStore`] (same database, `etl` schema —
/// excluded from the `spicedb_sync` publication), so a restart resumes from
/// the last SpiceDB-acknowledged LSN instead of re-copying. `start()` runs the
/// ETL source migrations (disable with `ETL_RUN_SOURCE_MIGRATIONS=false` when
/// the role lacks superuser) and fails fast on a missing publication or slot
/// problem, so misconfiguration fails boot rather than running unsynced.
///
/// # Arguments
///
/// * `spicedb_client` - Shared SpiceDB permissions client
/// * `spicedb_key` - Bearer key for SpiceDB requests
///
/// # Returns
///
/// * `Ok(Pipeline)` started and ready for [`Pipeline::wait`]
/// * `Err(ChaosError)` if the store, slot, or source setup fails
pub async fn start_pipeline(
    spicedb_client: PermissionsServiceClient<Channel>,
    spicedb_key: String,
) -> Result<Pipeline<PostgresStore, SpiceDBDestination>, crate::models::error::ChaosError> {
    use crate::models::error::ChaosError;

    fn etl_err(context: &str, e: impl std::fmt::Debug) -> ChaosError {
        ChaosError::InternalServerErrorWithMessage(format!("ETL {context}: {e:?}"))
    }

    let pg_connection = pg_connection()?;
    let run_source_migrations = matches!(
        std::env::var("ETL_RUN_SOURCE_MIGRATIONS").as_deref(),
        Err(_) | Ok("true")
    );

    let store = PostgresStore::new(PIPELINE_ID, pg_connection.clone())
        .await
        .map_err(|e| etl_err("PostgresStore setup failed", e))?;

    let config = PipelineConfig {
        id: PIPELINE_ID,
        publication_name: PUBLICATION_NAME.to_owned(),
        pg_connection,
        store_pg_connection: None,
        replication_slot: ReplicationSlotConfig::default(),
        batch: BatchConfig {
            max_fill_ms: BatchConfig::DEFAULT_MAX_FILL_MS,
            memory_budget_ratio: BatchConfig::DEFAULT_MEMORY_BUDGET_RATIO,
            max_bytes: BatchConfig::DEFAULT_MAX_BYTES,
        },
        table_error_retry_delay_ms: PipelineConfig::DEFAULT_TABLE_ERROR_RETRY_DELAY_MS,
        table_error_retry_max_attempts: PipelineConfig::DEFAULT_TABLE_ERROR_RETRY_MAX_ATTEMPTS,
        max_table_sync_workers: PipelineConfig::DEFAULT_MAX_TABLE_SYNC_WORKERS,
        max_copy_connections_per_table: PipelineConfig::DEFAULT_MAX_COPY_CONNECTIONS_PER_TABLE,
        memory_refresh_interval_ms: PipelineConfig::DEFAULT_MEMORY_REFRESH_INTERVAL_MS,
        memory_backpressure: Some(MemoryBackpressureConfig::default()),
        table_sync_copy: TableSyncCopyConfig::default(),
        table_sync_monitor_refresh_interval_ms:
            PipelineConfig::DEFAULT_TABLE_SYNC_MONITOR_REFRESH_INTERVAL_MS,
        invalidated_slot_behavior: InvalidatedSlotBehavior::default(),
        run_source_migrations,
    };

    let destination = SpiceDBDestination::new(spicedb_client, spicedb_key);
    let mut pipeline = Pipeline::new(config, store, destination);
    pipeline
        .start()
        .await
        .map_err(|e| etl_err("pipeline start failed", e))?;

    Ok(pipeline)
}

/// Advisory-lock key electing the single ETL pipeline leader (`"CHAOS_ET"`).
///
/// Offset by [`PIPELINE_ID`] so future pipelines elect independently. Locks are
/// per-database, so separate environments sharing a cluster never contend.
const ETL_LEADER_LOCK_KEY: i64 = 0x4348_4153_4554_3000;

/// Seconds between leadership attempts when following (default 10).
const LEADER_POLL_SECS: u64 = 10;

/// Seconds to wait before re-entering election after losing leadership or a
/// failed start (default 5).
const REELECT_BACKOFF_SECS: u64 = 5;

/// Holds the elected leader's advisory lock.
///
/// The advisory lock is session-scoped, so this guard keeps its dedicated
/// database connection checked out for the whole leadership term: dropping it
/// returns the connection and releases the lock. Never run queries on it.
pub struct LeaderLock {
    /// Dedicated connection holding the lock; doubles as a heartbeat channel.
    conn: sqlx::pool::PoolConnection<sqlx::Postgres>,
}

/// Outcome of a leadership election round.
pub enum Leadership {
    /// This instance holds the lock and must run the pipeline.
    Leader(LeaderLock),
    /// Another instance holds the lock; serve API only.
    Follower,
}

/// This instance's post-election role, decided once at boot.
pub enum EtlRole {
    /// Elected leader with a started pipeline: supervise it.
    Leader {
        /// Started pipeline to supervise until it exits.
        pipeline: Pipeline<PostgresStore, SpiceDBDestination>,
        /// Lock proving leadership; release ends the term.
        lock: LeaderLock,
    },
    /// Another instance leads: idle in election until the lock frees up.
    Follower,
}

/// Reads an env-provided seconds value, falling back to `default`.
fn env_secs(name: &str, default: u64) -> u64 {
    std::env::var(name)
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or(default)
}

/// Attempts to become the ETL leader exactly once.
///
/// Checks out a dedicated connection and tries the advisory lock: success
/// returns [`Leadership::Leader`] holding the connection, failure drops it and
/// returns [`Leadership::Follower`].
///
/// # Arguments
///
/// * `db` - Database pool to check the lock connection out of
///
/// # Returns
///
/// * `Ok(Leadership)` with the election outcome
/// * `Err(ChaosError)` if the pool itself is broken (caller should fail boot)
pub async fn stand_for_election(
    db: &sqlx::Pool<sqlx::Postgres>,
) -> Result<Leadership, crate::models::error::ChaosError> {
    use crate::models::error::ChaosError;

    let key = ETL_LEADER_LOCK_KEY + PIPELINE_ID as i64;
    let mut conn = db.acquire().await.map_err(|e| {
        ChaosError::InternalServerErrorWithMessage(format!("ETL election acquire failed: {e:?}"))
    })?;
    let locked: bool =
        sqlx::query_scalar::<sqlx::Postgres, bool>("SELECT pg_try_advisory_lock($1)")
            .bind(key)
            .fetch_one(&mut *conn)
            .await
            .map_err(|e| {
                ChaosError::InternalServerErrorWithMessage(format!(
                    "ETL election query failed: {e:?}"
                ))
            })?;

    if locked {
        Ok(Leadership::Leader(LeaderLock { conn }))
    } else {
        Ok(Leadership::Follower)
    }
}

/// Elects a leader and, on this instance winning, starts its pipeline.
///
/// A start failure here propagates so boot crashes loudly instead of serving
/// API while believing ETL runs. Followers boot cleanly as API-only servers
/// and pick up leadership later via [`campaign`].
///
/// # Arguments
///
/// * `db` - Database pool for the election and (as leader) the pipeline store
/// * `spicedb_client` - Shared SpiceDB permissions client
/// * `spicedb_key` - Bearer key for SpiceDB requests
///
/// # Returns
///
/// * `Ok(EtlRole)` with this instance's role
/// * `Err(ChaosError)` if the election itself breaks or the leader's pipeline
///   fails to start
pub async fn elect_and_start(
    db: &sqlx::Pool<sqlx::Postgres>,
    spicedb_client: PermissionsServiceClient<Channel>,
    spicedb_key: String,
) -> Result<EtlRole, crate::models::error::ChaosError> {
    match stand_for_election(db).await? {
        Leadership::Leader(lock) => {
            println!("ETL: elected leader, starting pipeline...");
            let pipeline = start_pipeline(spicedb_client, spicedb_key).await?;
            Ok(EtlRole::Leader { pipeline, lock })
        }
        Leadership::Follower => {
            println!("ETL: follower (another instance leads); API only");
            Ok(EtlRole::Follower)
        }
    }
}

/// Proves the leader still holds its lock via the dedicated connection.
///
/// The connection staying alive implies the session lock is held; any error
/// means leadership is (or may soon be) lost to another instance.
///
/// # Arguments
///
/// * `lock` - Leader lock whose connection to probe
///
/// # Returns
///
/// * `Ok(())` if the lock connection is alive
/// * `Err(ChaosError)` if the probe fails
async fn heartbeat(lock: &mut LeaderLock) -> Result<(), crate::models::error::ChaosError> {
    use crate::models::error::ChaosError;

    sqlx::query_scalar::<sqlx::Postgres, i32>("SELECT 1")
        .fetch_one(&mut *lock.conn)
        .await
        .map(|_| ())
        .map_err(|e| {
            ChaosError::InternalServerErrorWithMessage(format!(
                "ETL leader heartbeat failed: {e:?}"
            ))
        })
}

/// Supervises a leader term until the pipeline exits or leadership is lost.
///
/// Polls `pipeline.wait()` alongside heartbeats: a dead heartbeat shuts the
/// pipeline down (the new leader cannot grab the still-active slot until this
/// instance stops), then releases the lock. Never returns a pipeline error —
/// the caller falls through to [`campaign`].
///
/// # Arguments
///
/// * `pipeline` - Started leader pipeline to supervise
/// * `lock` - Lock proving leadership, released on return
async fn supervise_term(
    pipeline: Pipeline<PostgresStore, SpiceDBDestination>,
    mut lock: LeaderLock,
) {
    let poll_secs = env_secs("ETL_LEADER_POLL_SECS", LEADER_POLL_SECS);
    let wait_fut = pipeline.wait();
    tokio::pin!(wait_fut);
    let mut tick = tokio::time::interval(std::time::Duration::from_secs(poll_secs.max(1) / 2 + 1));

    loop {
        tokio::select! {
            result = &mut wait_fut => {
                match result {
                    Ok(()) => log::warn!("ETL pipeline exited cleanly; releasing leadership"),
                    Err(e) => log::error!("ETL pipeline exited: {e:?}; releasing leadership"),
                }
                break;
            }
            _ = tick.tick() => {
                if heartbeat(&mut lock).await.is_err() {
                    log::error!("ETL leader lock lost; shutting down pipeline");
                    pipeline.shutdown();
                }
            }
        }
    }
}

/// Idles in election until the lock frees up, then leads.
///
/// Post-boot start failures cannot crash anything (the server already serves),
/// so they log loudly, release the lock, back off, and retry.
///
/// # Arguments
///
/// * `db` - Database pool for elections and the pipeline store
/// * `spicedb_client` - Shared SpiceDB permissions client
/// * `spicedb_key` - Bearer key for SpiceDB requests
pub async fn campaign(
    db: sqlx::Pool<sqlx::Postgres>,
    spicedb_client: PermissionsServiceClient<Channel>,
    spicedb_key: String,
) {
    let poll = std::time::Duration::from_secs(env_secs("ETL_LEADER_POLL_SECS", LEADER_POLL_SECS));
    let backoff =
        std::time::Duration::from_secs(env_secs("ETL_REELECT_BACKOFF_SECS", REELECT_BACKOFF_SECS));

    loop {
        match stand_for_election(&db).await {
            Err(e) => {
                log::error!("ETL election failed: {e:?}; retrying");
                tokio::time::sleep(backoff).await;
            }
            Ok(Leadership::Follower) => tokio::time::sleep(poll).await,
            Ok(Leadership::Leader(lock)) => {
                match start_pipeline(spicedb_client.clone(), spicedb_key.clone()).await {
                    Err(e) => {
                        log::error!("ETL leader failed to start pipeline: {e:?}; retrying");
                        drop(lock);
                        tokio::time::sleep(backoff).await;
                    }
                    Ok(pipeline) => supervise_term(pipeline, lock).await,
                }
            }
        }
    }
}

/// Supervises an initial leader term, then campaigns forever.
///
/// Used by the boot-elected leader: after its first term ends (pipeline exit
/// or lost lock), it rejoins election like any follower.
///
/// # Arguments
///
/// * `db` - Database pool for elections and the pipeline store
/// * `spicedb_client` - Shared SpiceDB permissions client
/// * `spicedb_key` - Bearer key for SpiceDB requests
/// * `pipeline` - Started leader pipeline from [`elect_and_start`]
/// * `lock` - Lock proving leadership, released when the term ends
pub async fn supervise(
    db: sqlx::Pool<sqlx::Postgres>,
    spicedb_client: PermissionsServiceClient<Channel>,
    spicedb_key: String,
    pipeline: Pipeline<PostgresStore, SpiceDBDestination>,
    lock: LeaderLock,
) {
    supervise_term(pipeline, lock).await;
    campaign(db, spicedb_client, spicedb_key).await;
}
