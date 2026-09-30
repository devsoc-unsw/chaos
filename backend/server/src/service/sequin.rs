//! Maps Sequin change messages onto SpiceDB relationships.
//!
//! Sequin streams Postgres changes as JSON. Each message carries the row's
//! current state (`record`), the previous values of any changed columns
//! (`changes`), and the action that produced it. This module turns those into
//! the SpiceDB relationships the row owns, then applies a whole batch as one
//! coalesced `WriteRelationships` call.
//!
//! Every action maps through the same [`relationships_for_row`], differing only
//! in the operation it emits: an upsert for a row that exists, an explicit
//! delete for one that no longer does. Deletes are explicit because Postgres
//! cascades, so the rows that referenced a deleted row are deleted too and each
//! removes the relationships it owns. Nothing is left for a filtered delete to
//! discover, and every change in a batch stays in one atomic write.
//!
//! The table-to-relationship mapping is the same one the previous
//! supabase/etl-based destination used, so authorisation semantics are
//! unchanged by the switch to Sequin.

use crate::models::app::AppState;
use crate::models::error::ChaosError;
use crate::spicedb::authzed::api::v1::relationship_update::Operation;
use crate::spicedb::authzed::api::v1::ZedToken;
use crate::spicedb::schema::{relation, resource, PLATFORM_RESOURCE_ID};
use crate::spicedb::{new_relationship_update, write_relationships};
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
pub(crate) type RelKey = (&'static str, i64, &'static str, &'static str, i64);

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
pub(crate) fn to_update(
    entry: (RelKey, Operation),
) -> crate::spicedb::authzed::api::v1::RelationshipUpdate {
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

/// Builds one relationship operation.
///
/// `operation` is [`Operation::Touch`] when the row exists and should be
/// upserted, or [`Operation::Delete`] when the row has been deleted and the
/// same relationship must go. A row owns the same relationships in both
/// directions, so the two operations share this builder and the mapping below.
///
/// Touch (not Create) is what makes replayed batches converge instead of
/// failing the whole batch with `ATTEMPT_TO_RECREATE_RELATIONSHIP`, and
/// deleting a relationship that does not exist is a silent no-op, so replaying
/// a batch always converges.
fn edge(
    resource_type: &'static str,
    resource_id: i64,
    relation: &'static str,
    subject_type: &'static str,
    subject_id: i64,
    operation: Operation,
) -> (RelKey, Operation) {
    (
        (
            resource_type,
            resource_id,
            relation,
            subject_type,
            subject_id,
        ),
        operation,
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

/// Every table Sequin replicates, paired with the Postgres table it is read
/// from.
///
/// The reconciliation sweep in [`crate::service::reconcile`] walks this to build
/// the set of relationships Postgres justifies. Adding a replicated table means
/// adding it here as well as to the mapping below and to `sequin.yaml`; missing
/// it here would make the sweep treat that table's live relationships as
/// orphans.
pub const REPLICATED_TABLES: &[&str] = &[
    "users",
    "organisations",
    "organisation_members",
    "campaigns",
    "campaign_roles",
    "applications",
    "questions",
    "campaign_rating_categories",
    "application_ratings",
    "application_rating_category_ratings",
    "comments",
    "answers",
    "offers",
    "email_templates",
];

/// Maps a changed row to the SpiceDB relationships it owns.
///
/// Returns an empty vec when required columns are missing/null or the table
/// owns no relationships (association tables, invites, tokens, …). Each entry is
/// a `(relationship, operation)` pair for [`record`], not a finished update, so
/// a batch touching the same relationship twice coalesces.
///
/// This is the single definition of the row-to-relationship mapping. The
/// reconciliation sweep calls it to derive what Postgres justifies, so a second
/// definition elsewhere would drift and every drifted key would be deleted as an
/// orphan.
///
/// # Arguments
///
/// * `table` - Source table name, from the message metadata
/// * `record` - The row's current state
/// * `operation` - [`Operation::Touch`] to upsert, or [`Operation::Delete`] to
///   remove. A deleted row owns the same relationships as a live one, so the
///   delete set is exactly the touch set with the operation swapped.
///
/// # Returns
///
/// * The relationship operations this row implies
pub(crate) fn relationships_for_row(
    table: &str,
    record: &Value,
    operation: Operation,
) -> Vec<(RelKey, Operation)> {
    match table {
        "users" => {
            let (Some(id), Some(role)) = (cell_i64(record, "id"), cell_str(record, "role")) else {
                return vec![];
            };
            vec![edge(
                resource::PLATFORM,
                PLATFORM_RESOURCE_ID,
                platform_relation(role),
                resource::USER,
                id,
                operation,
            )]
        }
        "organisations" => {
            let Some(id) = cell_i64(record, "id") else {
                return vec![];
            };
            vec![edge(
                resource::ORGANISATION,
                id,
                relation::organisation::PLATFORM,
                resource::PLATFORM,
                PLATFORM_RESOURCE_ID,
                operation,
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
            vec![edge(
                resource::ORGANISATION,
                oid,
                organisation_relation(role),
                resource::USER,
                uid,
                operation,
            )]
        }
        "campaigns" => {
            let (Some(id), Some(oid)) =
                (cell_i64(record, "id"), cell_i64(record, "organisation_id"))
            else {
                return vec![];
            };
            vec![edge(
                resource::CAMPAIGN,
                id,
                relation::campaign::ORGANISATION,
                resource::ORGANISATION,
                oid,
                operation,
            )]
        }
        "campaign_roles" => {
            let (Some(id), Some(cid)) = (cell_i64(record, "id"), cell_i64(record, "campaign_id"))
            else {
                return vec![];
            };
            vec![edge(
                resource::CAMPAIGN_ROLE,
                id,
                relation::campaign_role::CAMPAIGN,
                resource::CAMPAIGN,
                cid,
                operation,
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
                edge(
                    resource::APPLICATION,
                    id,
                    relation::application::CAMPAIGN,
                    resource::CAMPAIGN,
                    cid,
                    operation,
                ),
                edge(
                    resource::APPLICATION,
                    id,
                    relation::application::CREATOR,
                    resource::USER,
                    uid,
                    operation,
                ),
            ]
        }
        "questions" => {
            let (Some(id), Some(cid)) = (cell_i64(record, "id"), cell_i64(record, "campaign_id"))
            else {
                return vec![];
            };
            vec![edge(
                resource::QUESTION,
                id,
                relation::question::CAMPAIGN,
                resource::CAMPAIGN,
                cid,
                operation,
            )]
        }
        "campaign_rating_categories" => {
            let (Some(id), Some(cid)) = (cell_i64(record, "id"), cell_i64(record, "campaign_id"))
            else {
                return vec![];
            };
            vec![edge(
                resource::RATING_CATEGORY,
                id,
                relation::rating_category::CAMPAIGN,
                resource::CAMPAIGN,
                cid,
                operation,
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
                edge(
                    resource::RATING,
                    id,
                    relation::rating::APPLICATION,
                    resource::APPLICATION,
                    aid,
                    operation,
                ),
                edge(
                    resource::RATING,
                    id,
                    relation::rating::CREATOR,
                    resource::USER,
                    rid,
                    operation,
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
            vec![edge(
                resource::CATEGORY_RATING,
                id,
                relation::category_rating::RATING,
                resource::RATING,
                rid,
                operation,
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
                edge(
                    resource::COMMENT,
                    id,
                    relation::comment::APPLICATION,
                    resource::APPLICATION,
                    aid,
                    operation,
                ),
                edge(
                    resource::COMMENT,
                    id,
                    relation::comment::CREATOR,
                    resource::USER,
                    uid,
                    operation,
                ),
            ]
        }
        "answers" => {
            let (Some(id), Some(aid)) =
                (cell_i64(record, "id"), cell_i64(record, "application_id"))
            else {
                return vec![];
            };
            vec![edge(
                resource::ANSWER,
                id,
                relation::answer::APPLICATION,
                resource::APPLICATION,
                aid,
                operation,
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
                edge(
                    resource::OFFER,
                    id,
                    relation::offer::CAMPAIGN,
                    resource::CAMPAIGN,
                    cid,
                    operation,
                ),
                edge(
                    resource::OFFER,
                    id,
                    relation::offer::APPLICATION,
                    resource::APPLICATION,
                    aid,
                    operation,
                ),
            ]
        }
        "email_templates" => {
            let (Some(id), Some(oid)) =
                (cell_i64(record, "id"), cell_i64(record, "organisation_id"))
            else {
                return vec![];
            };
            vec![edge(
                resource::EMAIL_TEMPLATE,
                id,
                relation::email_template::ORGANISATION,
                resource::ORGANISATION,
                oid,
                operation,
            )]
        }
        _ => vec![],
    }
}

/// Folds one message into the batch's pending operations.
///
/// `insert` and `read` (backfill) both mean "this row now exists", so they
/// produce the same touches. `update` additionally retires the relation the row
/// used to imply, taken from `changes`, so a role flip does not leave the old
/// relation behind. `delete` emits the row's relationships as explicit deletes.
///
/// Deletes are explicit rather than a filtered `delete_all_resource_relationships`
/// because the relationships a row owns are knowable: Postgres cascades, so
/// every row that referenced a deleted row is itself deleted and arrives as its
/// own delete message, and each one removes the relationships it owns. A
/// filtered delete would instead wipe relations created by other tables and
/// issued in the same batch, which the coalesced map can no longer order
/// against a separately-timed RPC.
fn collect(ops: &mut Ops, message: &SequinMessage) {
    let table = message.metadata.table_name.as_str();

    if message.metadata.table_schema != "public" {
        // Only the public schema is replicated; anything else is unexpected and
        // ignored rather than guessed at.
        return;
    }

    match message.action.as_str() {
        "insert" | "read" => {
            for entry in relationships_for_row(table, &message.record, Operation::Touch) {
                record(ops, entry);
            }
        }
        "update" => {
            for entry in relationships_for_row(table, &message.record, Operation::Touch) {
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
                                edge(
                                    resource::PLATFORM,
                                    PLATFORM_RESOURCE_ID,
                                    platform_relation(previous),
                                    resource::USER,
                                    id,
                                    Operation::Delete,
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
                                edge(
                                    resource::ORGANISATION,
                                    oid,
                                    organisation_relation(previous),
                                    resource::USER,
                                    uid,
                                    Operation::Delete,
                                ),
                            );
                        }
                    }
                    _ => {}
                }
            }
        }
        "delete" => {
            // The same relationship set the row owned, now removed explicitly.
            // Postgres cascades mean any row that pointed at this one is also
            // deleted and arrives here with its own relationships, so there is
            // nothing left behind for a filtered delete to catch.
            for entry in relationships_for_row(table, &message.record, Operation::Delete) {
                record(ops, entry);
            }
        }
        // Unknown actions are ignored rather than failing the batch, so a newer
        // Sequin action cannot wedge the stream.
        _ => {}
    }
}

/// Applies a Sequin batch to SpiceDB as one coalesced write.
///
/// Touches and deletes are folded into a single ordered map (last write per
/// relationship wins) and sent as one `WriteRelationships` call, so the batch is
/// atomic and cannot contain two updates for one relationship. Deletes are
/// ordinary entries in that map rather than a separate filtered delete, so the
/// whole batch is ordered by change order and replayed identically.
///
/// # Ordering
///
/// Sequin delivers the messages of one group — a row, or the
/// `organisation_members` pair configured in `sequin.yaml` — serially, and holds
/// back later messages in that group until the current one is acknowledged. A
/// batch may still contain several messages for one group, which arrive in
/// commit order, and the coalescing above keeps only the newest.
///
/// That blocking is what makes returning an error safe *and* necessary: a failed
/// batch is retried by Sequin, and until it succeeds Sequin will not deliver the
/// next change to the same row, so a later change cannot overtake a failure.
/// Acknowledging a batch that was not applied would reopen that hole, so the
/// error below must stay an error. This only orders Sequin's own messages; a
/// direct SpiceDB write from a request path is not part of that sequence (see
/// the SpiceDB catch-up note in `AGENTS.md`).
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
///   Sequin retries the batch and blocks later messages for the same group
pub async fn apply_batch(state: &AppState, batch: &SequinBatch) -> Result<usize, ChaosError> {
    let mut ops: Ops = Ops::default();

    for message in &batch.data {
        collect(&mut ops, message);
    }

    if ops.is_empty() {
        return Ok(0);
    }

    let updates: Vec<_> = ops.into_iter().map(to_update).collect();
    let count = updates.len();
    let token = write_relationships(&state.spicedb, &state.spicedb_key, updates).await?;
    publish_token(state, token);

    Ok(count)
}

/// Publishes a SpiceDB write's ZedToken to the token task.
///
/// The token task (`spicedb::apply_zedtokens`) owns the stored token; sending
/// here means a synced change is visible to the next permission check without
/// waiting for anything else. A closed channel means the token task has
/// exited, so the token is dropped and the freshness boundary stays where it
/// was — the next write republishes.
pub(crate) fn publish_token(state: &AppState, token: Option<ZedToken>) {
    if let Some(token) = token {
        let _ = state.spicedb_token_tx.send(token);
    }
}
