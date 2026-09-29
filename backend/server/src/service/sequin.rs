//! Maps Sequin change messages onto SpiceDB relationships.
//!
//! Sequin streams Postgres changes as JSON. Each message carries the row's
//! current state (`record`), the previous values of any changed columns
//! (`changes`), and the action that produced it. This module turns those into
//! the SpiceDB relationships the row owns, then applies a whole batch as one
//! coalesced `WriteRelationships` call.
//!
//! The table-to-relationship mapping is the same one the previous
//! supabase/etl-based destination used, so authorisation semantics are
//! unchanged by the switch to Sequin.

use crate::models::app::AppState;
use crate::models::error::ChaosError;
use crate::spicedb::authzed::api::v1::relationship_update::Operation;
use crate::spicedb::authzed::api::v1::ZedToken;
use crate::spicedb::schema::{relation, resource, PLATFORM_RESOURCE_ID};
use crate::spicedb::{
    delete_all_resource_relationships, new_relationship_update, write_relationships,
};
use indexmap::IndexMap;
use serde::Deserialize;
use serde_json::Value;

/// A batch of Sequin messages, as posted by a sink with `batch: true`.
///
/// Sequin also sends a bare message object when batching is off; this sink is
/// always configured with batching, so only the batch shape is accepted.
#[derive(Debug, Deserialize)]
pub struct SequinBatch {
    /// The changes in this batch, in commit order.
    pub data: Vec<SequinMessage>,
}

/// One Postgres change delivered by Sequin.
#[derive(Debug, Deserialize)]
pub struct SequinMessage {
    /// The row's current state. For a `delete` this is the deleted row.
    pub record: Value,

    /// Previous values of the columns that changed. `null` unless `update`.
    #[serde(default)]
    pub changes: Option<Value>,

    /// The change kind: `insert`, `update`, `delete`, or `read` (backfill).
    pub action: String,

    /// Context about the change, used here for the source table name.
    pub metadata: SequinMetadata,
}

/// Metadata Sequin attaches to each message.
#[derive(Debug, Deserialize)]
pub struct SequinMetadata {
    /// Schema of the changed table, e.g. `public`.
    pub table_schema: String,

    /// Name of the changed table, e.g. `organisation_members`.
    pub table_name: String,
}

/// Identifies one SpiceDB relationship, so repeated changes to it within a
/// batch can be coalesced into a single final operation.
///
/// The resource/relation/subject types are the `&'static str` constants from
/// [`crate::spicedb::schema`], never runtime strings, which is what lets this
/// be a plain tuple usable as a map key.
type RelKey = (&'static str, i64, &'static str, &'static str, i64);

/// A relationship's intended final operation, ordered by first appearance in
/// the batch.
///
/// One `WriteRelationships` call rejects two updates to the same relationship
/// (`ERROR_REASON_UPDATES_ON_SAME_RELATIONSHIP`), so a batch that both creates
/// and deletes the same row must send one update, not two. Insertion order is
/// preserved so the call still reflects change order.
type Ops = IndexMap<RelKey, Operation>;

/// Records an operation for a relationship, last write winning.
///
/// Sequin delivers a batch in commit order, so the last operation seen for a
/// relationship is the state that should exist once the batch is applied. That
/// makes create-then-delete collapse to a single `Delete`, and role flips
/// collapse to the final relation only.
fn record(ops: &mut Ops, entry: (RelKey, Operation)) {
    ops.insert(entry.0, entry.1);
}

/// Renders one coalesced entry as a SpiceDB relationship update.
fn to_update(entry: (RelKey, Operation)) -> crate::spicedb::authzed::api::v1::RelationshipUpdate {
    let ((resource_type, resource_id, relation, subject_type, subject_id), operation) = entry;
    new_relationship_update(
        operation,
        resource_type,
        resource_id,
        relation,
        subject_type,
        subject_id,
    )
}

/// Builds an idempotent upsert for a SpiceDB relationship.
///
/// Touch (not Create) is what makes replayed batches converge instead of
/// failing the whole batch with `ATTEMPT_TO_RECREATE_RELATIONSHIP`.
fn touch(
    resource_type: &'static str,
    resource_id: i64,
    relation: &'static str,
    subject_type: &'static str,
    subject_id: i64,
) -> (RelKey, Operation) {
    (
        (
            resource_type,
            resource_id,
            relation,
            subject_type,
            subject_id,
        ),
        Operation::Touch,
    )
}

/// Builds a single-relationship delete.
///
/// Deleting a relationship that does not exist is a silent success in SpiceDB,
/// so replaying a batch never fails on an already-applied delete.
fn delete(
    resource_type: &'static str,
    resource_id: i64,
    relation: &'static str,
    subject_type: &'static str,
    subject_id: i64,
) -> (RelKey, Operation) {
    (
        (
            resource_type,
            resource_id,
            relation,
            subject_type,
            subject_id,
        ),
        Operation::Delete,
    )
}

/// Reads a Postgres `BIGINT` (a Chaos ID) from a Sequin record or changes map.
///
/// Sequin serialises `bigint` as a JSON number, but accepts values that arrive
/// as strings too, so both are handled.
fn cell_i64(value: &Value, column: &str) -> Option<i64> {
    match value.get(column)? {
        Value::Number(number) => number.as_i64(),
        Value::String(text) => text.parse().ok(),
        _ => None,
    }
}

/// Reads a Postgres enum from a Sequin record or changes map.
fn cell_str<'a>(value: &'a Value, column: &str) -> Option<&'a str> {
    value.get(column)?.as_str()
}

/// Returns the `platform` relation a user role implies.
fn platform_relation(role: &str) -> &'static str {
    if role == "SuperUser" {
        relation::platform::SUPERUSER
    } else {
        relation::platform::USER
    }
}

/// Returns the `organisation` relation a membership role implies.
fn organisation_relation(role: &str) -> &'static str {
    if role == "Admin" {
        relation::organisation::ADMIN
    } else {
        relation::organisation::MEMBER
    }
}

/// Maps a changed row to the SpiceDB relationships it owns.
///
/// Returns an empty vec when required columns are missing/null or the table
/// owns no relationships (association tables, invites, tokens, …). Each entry is
/// a `(relationship, operation)` pair for [`record`], not a finished update, so
/// a batch touching the same relationship twice coalesces.
///
/// # Arguments
///
/// * `table` - Source table name, from the message metadata
/// * `record` - The row's current state
///
/// # Returns
///
/// * The relationship operations this row implies
fn touches_for_row(table: &str, record: &Value) -> Vec<(RelKey, Operation)> {
    match table {
        "users" => {
            let (Some(id), Some(role)) = (cell_i64(record, "id"), cell_str(record, "role")) else {
                return vec![];
            };
            vec![touch(
                resource::PLATFORM,
                PLATFORM_RESOURCE_ID,
                platform_relation(role),
                resource::USER,
                id,
            )]
        }
        "organisations" => {
            let Some(id) = cell_i64(record, "id") else {
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
                cell_i64(record, "organisation_id"),
                cell_i64(record, "user_id"),
                cell_str(record, "role"),
            ) else {
                return vec![];
            };
            vec![touch(
                resource::ORGANISATION,
                oid,
                organisation_relation(role),
                resource::USER,
                uid,
            )]
        }
        "campaigns" => {
            let (Some(id), Some(oid)) =
                (cell_i64(record, "id"), cell_i64(record, "organisation_id"))
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
            let (Some(id), Some(cid)) = (cell_i64(record, "id"), cell_i64(record, "campaign_id"))
            else {
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
                cell_i64(record, "id"),
                cell_i64(record, "campaign_id"),
                cell_i64(record, "user_id"),
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
            let (Some(id), Some(cid)) = (cell_i64(record, "id"), cell_i64(record, "campaign_id"))
            else {
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
            let (Some(id), Some(cid)) = (cell_i64(record, "id"), cell_i64(record, "campaign_id"))
            else {
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
                cell_i64(record, "id"),
                cell_i64(record, "application_id"),
                cell_i64(record, "rater_id"),
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
            let (Some(id), Some(rid)) = (
                cell_i64(record, "id"),
                cell_i64(record, "application_rating_id"),
            ) else {
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
                cell_i64(record, "id"),
                cell_i64(record, "application_id"),
                cell_i64(record, "author_id"),
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
            let (Some(id), Some(aid)) =
                (cell_i64(record, "id"), cell_i64(record, "application_id"))
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
                cell_i64(record, "id"),
                cell_i64(record, "campaign_id"),
                cell_i64(record, "application_id"),
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
            let (Some(id), Some(oid)) =
                (cell_i64(record, "id"), cell_i64(record, "organisation_id"))
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

/// Folds one message into the batch's pending operations.
///
/// `insert` and `read` (backfill) both mean "this row now exists", so they
/// produce the same touches. `update` additionally retires the relation the row
/// used to imply, taken from `changes`, so a role flip does not leave the old
/// relation behind. `delete` retires every relationship the row owned, which is
/// handled separately because it needs a filtered delete rather than a
/// per-relationship one.
fn collect(ops: &mut Ops, deletes: &mut Vec<(&'static str, i64)>, message: &SequinMessage) {
    let table = message.metadata.table_name.as_str();

    if message.metadata.table_schema != "public" {
        // Only the public schema is replicated; anything else is unexpected and
        // ignored rather than guessed at.
        return;
    }

    match message.action.as_str() {
        "insert" | "read" => {
            for entry in touches_for_row(table, &message.record) {
                record(ops, entry);
            }
        }
        "update" => {
            for entry in touches_for_row(table, &message.record) {
                record(ops, entry);
            }
            // Retire the previous relation. `changes` holds the old value of
            // every column this change touched, so the old role is only present
            // when the role actually changed.
            if let Some(changes) = message.changes.as_ref() {
                match table {
                    "users" => {
                        if let (Some(id), Some(previous)) =
                            (cell_i64(&message.record, "id"), cell_str(changes, "role"))
                        {
                            record(
                                ops,
                                delete(
                                    resource::PLATFORM,
                                    PLATFORM_RESOURCE_ID,
                                    platform_relation(previous),
                                    resource::USER,
                                    id,
                                ),
                            );
                        }
                    }
                    "organisation_members" => {
                        if let (Some(oid), Some(uid), Some(previous)) = (
                            cell_i64(&message.record, "organisation_id"),
                            cell_i64(&message.record, "user_id"),
                            cell_str(changes, "role"),
                        ) {
                            record(
                                ops,
                                delete(
                                    resource::ORGANISATION,
                                    oid,
                                    organisation_relation(previous),
                                    resource::USER,
                                    uid,
                                ),
                            );
                        }
                    }
                    _ => {}
                }
            }
        }
        "delete" => {
            // A deleted row owns a resource (and, for memberships, a relation),
            // so retire everything it owned. The resource delete is filtered and
            // so covers relations created by other tables; the membership case
            // is handled by the caller as a per-relationship delete.
            if let Some(res_type) = resource_for_table(table) {
                if let Some(id) = cell_i64(&message.record, "id") {
                    deletes.push((res_type, id));
                }
            } else if table == "organisation_members" {
                if let (Some(oid), Some(uid), Some(role)) = (
                    cell_i64(&message.record, "organisation_id"),
                    cell_i64(&message.record, "user_id"),
                    cell_str(&message.record, "role"),
                ) {
                    record(
                        ops,
                        delete(
                            resource::ORGANISATION,
                            oid,
                            organisation_relation(role),
                            resource::USER,
                            uid,
                        ),
                    );
                }
            }
        }
        // Unknown actions are ignored rather than failing the batch, so a newer
        // Sequin action cannot wedge the stream.
        _ => {}
    }
}

/// Applies a Sequin batch to SpiceDB as one coalesced write.
///
/// Relationship touches and deletes are folded into a single ordered map (last
/// write per relationship wins) and sent as one `WriteRelationships` call, so
/// the batch is atomic and cannot contain two updates for one relationship.
/// Resource deletes are filtered deletes, which are a different SpiceDB API and
/// so run after the batch; they are idempotent, so a replay converges.
///
/// # Arguments
///
/// * `state` - The application state, holding the SpiceDB client and key
/// * `batch` - The batch Sequin delivered
///
/// # Returns
///
/// * `Ok(count)` with the number of relationship updates applied
/// * `Err(ChaosError)` if a SpiceDB call fails; the caller must return 5XX so
///   Sequin retries the batch
pub async fn apply_batch(state: &AppState, batch: &SequinBatch) -> Result<usize, ChaosError> {
    let mut ops: Ops = Ops::default();
    let mut deletes: Vec<(&'static str, i64)> = Vec::new();

    for message in &batch.data {
        collect(&mut ops, &mut deletes, message);
    }

    let applied = if ops.is_empty() {
        0
    } else {
        let updates: Vec<_> = ops.into_iter().map(to_update).collect();
        let count = updates.len();
        let token = write_relationships(&state.spicedb, &state.spicedb_key, updates).await?;
        publish_token(state, token);
        count
    };

    // Filtered resource deletes run after the batch so a row deleted and
    // recreated within one batch still ends up with its relationships removed.
    for (res_type, id) in deletes {
        delete_all_resource_relationships(
            &state.spicedb,
            &state.spicedb_key,
            res_type,
            id,
            &state.spicedb_token_tx,
        )
        .await?;
    }

    Ok(applied)
}

/// Publishes a SpiceDB write's ZedToken to the Watch task.
///
/// The Watch task owns the stored token; sending here means a synced change is
/// visible to the next permission check without waiting for the Watch stream.
/// A closed channel only means the Watch task is gone, which is not fatal: the
/// stream catches up on its own.
fn publish_token(state: &AppState, token: Option<ZedToken>) {
    if let Some(token) = token {
        let _ = state.spicedb_token_tx.send(token);
    }
}
