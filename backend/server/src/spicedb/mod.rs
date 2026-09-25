//! SpiceDB gRPC API bindings and authorization helpers.
//!
//! The modules under this one (except [`policies`] & [`schema`]) are generated from the
//! Authzed protobuf definitions by `buf` (see `backend/buf.gen.yaml`) and
//! should not be edited by hand. The handwritten code below provides the
//! authorization building blocks used by HTTP handlers:
//!
//! * [`SpiceDbAuth`] - an Axum extractor that authorizes a request against a
//!   [`SpiceDbPolicy`] via a SpiceDB permission check.

pub mod policies;
pub mod schema;

// Generated modules
pub mod authzed {
    pub mod api {
        pub mod v1 {
            include!("generated/authzed/api/v1/authzed.api.v1.rs");
        }

        pub mod materialize {
            pub mod v0 {
                include!("generated/authzed/api/materialize/v0/authzed.api.materialize.v0.rs");
            }
        }
    }
}

pub mod google {
    pub mod api {
        include!("generated/google/api/google.api.rs");
    }

    pub mod rpc {
        include!("generated/google/rpc/google.rpc.rs");
    }
}

pub mod validate {
    include!("generated/validate/validate.rs");
}

pub mod buf {
    pub mod validate {
        include!("generated/buf/validate/buf.validate.rs");
    }
}

pub mod grpc {
    pub mod gateway {
        pub mod protoc_gen_openapiv2 {
            pub mod options {
                include!(
                    "generated/grpc/gateway/protoc_gen_openapiv2/options/grpc.gateway.protoc_gen_openapiv2.options.rs"
                );
            }
        }
    }
}

// Handwritten SpiceDB authorization code

use axum::{
    async_trait,
    extract::{FromRef, FromRequestParts, Path},
    http::request::Parts,
    RequestPartsExt,
};
use std::sync::{Arc, RwLock};
use std::{collections::HashMap, marker::PhantomData};
use tokio::sync::{Mutex, Notify};
use tonic::{metadata::MetadataValue, transport::Channel, Request};

use crate::spicedb::authzed::api::v1::{
    schema_service_client::SchemaServiceClient, watch_service_client::WatchServiceClient,
    DeleteRelationshipsRequest, RelationshipFilter, SubjectFilter, WatchKind, WatchRequest,
    WriteSchemaRequest, ZedToken,
};
use crate::spicedb::schema::PLATFORM_RESOURCE_ID;
use crate::{
    models::{app::AppState, error::ChaosError, transaction::DBTransaction},
    service::auth::extract_user_id_from_request,
    spicedb::authzed::api::v1::{
        check_permission_response::Permissionship, consistency::Requirement,
        permissions_service_client::PermissionsServiceClient, relationship_update::Operation,
        CheckPermissionRequest, Consistency, ObjectReference, Relationship, RelationshipUpdate,
        SubjectReference, WriteRelationshipsRequest,
    },
};

/// Returns SpiceDB `Consistency` to use depending on if ZedToken is available.
///
/// # Arguments
///
/// * `zedtoken` - The ZedToken stored in `AppState`
///
/// # Returns
///
/// * `Consistency` setting to use (`MinimizeLatency` or `AtLeastAsFresh`)
fn consistency_from_stored(zedtoken: &RwLock<Option<ZedToken>>) -> Consistency {
    let requirement = match zedtoken.read().unwrap().clone() {
        Some(token) => Requirement::AtLeastAsFresh(token),
        None => Requirement::MinimizeLatency(true),
    };

    Consistency {
        requirement: Some(requirement),
    }
}

/// Store given ZedToken into `RwLock`
///
/// The stored token is the freshness boundary supplied to
/// [`consistency_from_stored`]. It must never go backwards, or later
/// authorization checks would use an outdated `AtLeastAsFresh` boundary.
///
/// ZedTokens are opaque to clients (SpiceDB revisions are not byte-sortable
/// and their wire format is datastore-specific), so this function cannot
/// compare tokens itself. Monotonicity is instead guaranteed by the Watch
/// task ([`spawn_zedtoken_watcher`]), which feeds tokens in ascending
/// revision order and gates them behind pending `DBTransaction` writes. Do
/// not call this from write paths: an older write finishing last would
/// unconditionally overwrite a newer token.
///
/// # Arguments
///
/// * `zedtoken` - The ZedToken lock in `AppState`
/// * `token` - The new token to be stored, if any
///
/// # Returns
///
/// Returns nothing
fn store_zedtoken(zedtoken: &RwLock<Option<ZedToken>>, token: Option<ZedToken>) {
    if let Some(token) = token {
        *zedtoken.write().unwrap() = Some(token);
    }
}

/// Shared state gating publication of Watch tokens.
///
/// `pending_writes` counts `DBTransaction` commits that have applied a
/// SpiceDB relationship write whose Postgres transaction has not reached a
/// final state (committed, or compensated after failure). `deferred_token`
/// holds the newest Watch token received while the gate was closed. Both are
/// protected by a single async mutex; only the Watch task writes the
/// published token in [`AppState::spicedb_zedtoken`].
pub struct ZedTokenPublicationGate {
    /// Number of pending SpiceDB writes with an unresolved Postgres commit.
    pub pending_writes: usize,

    /// Newest Watch token received while `pending_writes` was non-zero.
    pub deferred_token: Option<ZedToken>,
}

impl ZedTokenPublicationGate {
    /// Create a gate with no pending writes and no deferred token.
    pub fn new() -> Self {
        Self {
            pending_writes: 0,
            deferred_token: None,
        }
    }
}

/// Registers a pending SpiceDB relationship write on the gate.
///
/// Must be called *before* the SpiceDB write RPC: the Watch stream can
/// report the revision as soon as the write lands, and the gate must already
/// be closed by then, or the token would be published while the Postgres
/// commit is still at risk.
///
/// # Arguments
///
/// * `gate` - The shared publication gate
pub async fn register_pending_write(gate: &Arc<Mutex<ZedTokenPublicationGate>>) {
    gate.lock().await.pending_writes += 1;
}

/// Resolves a pending SpiceDB relationship write on the gate.
///
/// Notifies the Watch task when the last pending write resolves, so it can
/// publish the deferred token even while SpiceDB is idle. Do not call this
/// on a compensation failure: SpiceDB and Postgres have then diverged and
/// the gate must stay closed.
///
/// # Arguments
///
/// * `gate` - The shared publication gate
/// * `notify` - Waker for the Watch task
pub async fn resolve_pending_write(
    gate: &Arc<Mutex<ZedTokenPublicationGate>>,
    notify: &Arc<Notify>,
) {
    let mut gate = gate.lock().await;
    gate.pending_writes -= 1;
    if gate.pending_writes == 0 {
        notify.notify_one();
    }
}

/// Defers or publishes a Watch token depending on the gate.
///
/// While any write is pending, the token is held back: its revision may
/// include relationships whose Postgres commit has not succeeded yet. Once
/// the gate is open, the token is published and any older deferred token is
/// dropped as covered (the stream delivers tokens in ascending revision
/// order, so a freshly delivered token is never older than the deferred
/// one).
///
/// # Arguments
///
/// * `gate` - The shared publication gate
/// * `zedtoken` - The shared published token lock
/// * `token` - The token delivered by the Watch stream
async fn defer_or_publish(
    gate: &Arc<Mutex<ZedTokenPublicationGate>>,
    zedtoken: &Arc<RwLock<Option<ZedToken>>>,
    token: ZedToken,
) {
    let mut gate = gate.lock().await;
    if gate.pending_writes > 0 {
        gate.deferred_token = Some(token);
    } else {
        gate.deferred_token = None;
        store_zedtoken(&*zedtoken, Some(token));
    }
}

/// Publishes the deferred token once the gate is open.
///
/// # Arguments
///
/// * `gate` - The shared publication gate
/// * `zedtoken` - The shared published token lock
async fn publish_deferred(
    gate: &Arc<Mutex<ZedTokenPublicationGate>>,
    zedtoken: &Arc<RwLock<Option<ZedToken>>>,
) {
    let mut gate = gate.lock().await;
    if gate.pending_writes == 0 {
        if let Some(token) = std::mem::take(&mut gate.deferred_token) {
            store_zedtoken(&*zedtoken, Some(token));
        }
    }
}

/// Tracks SpiceDB revisions in the background, keeping the stored ZedToken
/// monotonically increasing.
///
/// This is the single writer of the stored token (see [`store_zedtoken`]).
/// It streams relationship changes via the Watch API, which delivers every
/// response's `changes_through` token in ascending revision order, so the
/// shared freshness boundary only ever moves forward.
///
/// Publication is gated on [`ZedTokenPublicationGate`]: while any
/// `DBTransaction` commit has an uncommitted SpiceDB write, tokens are
/// deferred instead of published. A pending write's revision may contain
/// relationships that Postgres has not committed yet (and may still reject
/// and compensate), so publishing it could let a concurrent check authorize
/// a relationship that is later removed. When the last pending write
/// resolves, the task is woken via [`Notify`] and publishes the deferred
/// token.
///
/// Each (re)connection starts from the current head revision rather than
/// resuming from the stored token, because the head is always at or past the
/// stored token, keeps the stream monotonic across reconnects, and sidesteps
/// garbage-collection errors for stale cursors. Requests include checkpoints
/// so the stream stays alive while idle.
///
/// # Arguments
///
/// * `app_state` - The application state holding the SpiceDB client, key and
///   shared zedtoken lock
///
/// # Returns
///
/// Never returns; runs until the process exits.
pub async fn spawn_zedtoken_watcher(app_state: AppState) {
    loop {
        let endpoint =
            std::env::var("SPICEDB_GRPC_ENDPOINT").expect("SPICEDB_GRPC_ENDPOINT must be set");
        let channel = Channel::from_shared(endpoint)
            .expect("SPICEDB_GRPC_ENDPOINT must be a valid URI")
            .connect_lazy();
        let mut client = WatchServiceClient::new(channel);

        let request = match authorized_request(
            WatchRequest {
                optional_object_types: Vec::new(),
                optional_start_cursor: None,
                optional_relationship_filters: Vec::new(),
                optional_update_kinds: vec![
                    WatchKind::IncludeRelationshipUpdates as i32,
                    WatchKind::IncludeCheckpoints as i32,
                ],
            },
            &app_state.spicedb_key,
        ) {
            Ok(request) => request,
            Err(error) => {
                println!("Failed to build SpiceDB watch request: {error}");
                tokio::time::sleep(std::time::Duration::from_millis(1000)).await;
                continue;
            }
        };

        match client.watch(request).await {
            Ok(response) => {
                let mut stream = response.into_inner();
                'stream: loop {
                    tokio::select! {
                        message = stream.message() => {
                            match message {
                                Ok(Some(response)) => {
                                    // Defer while a DBTransaction write is
                                    // pending; publish once the gate is open.
                                    if let Some(token) = response.changes_through {
                                        defer_or_publish(
                                            &app_state.spicedb_publication_gate,
                                            &app_state.spicedb_zedtoken,
                                            token,
                                        )
                                        .await;
                                    }
                                }
                                Ok(None) => break 'stream,
                                Err(error) => {
                                    println!("SpiceDB watch stream error: {error}");
                                    break 'stream;
                                }
                            }
                        }
                        _ = app_state.spicedb_publication_notify.notified() => {}
                    }

                    // A pending write may have resolved while SpiceDB is
                    // idle; publish its deferred token now.
                    publish_deferred(
                        &app_state.spicedb_publication_gate,
                        &app_state.spicedb_zedtoken,
                    )
                    .await;
                }
            }
            Err(error) => println!("SpiceDB watch stream failed: {error}"),
        }

        tokio::time::sleep(std::time::Duration::from_millis(1000)).await;
    }
}

/// Builds a SpiceDB request with the bearer-token metadata attached.
//
/// # Arguments
///
/// * `message` - The protobuf request body
/// * `key` - Bearer token used to authenticate with SpiceDB
///
/// # Returns
///
/// * `Ok(Request<T>)` with the `authorization` metadata set
/// * `Err(ChaosError::InternalServerError)` if the key is not valid metadata
fn authorized_request<T>(message: T, key: &str) -> Result<Request<T>, ChaosError> {
    let mut request = Request::new(message);

    let authorization = format!("Bearer {key}")
        .parse::<MetadataValue<_>>()
        .map_err(|_| ChaosError::InternalServerError)?;
    request
        .metadata_mut()
        .insert("authorization", authorization);

    Ok(request)
}

/// Applies the SpiceDB schema from `backend/spicedb/schema.yaml` to the
/// SpiceDB server via `WriteSchema`.
///
/// This is an idempotent upsert of the full schema. It keeps the schema in
/// sync at server startup in environments without
/// `SPICEDB_DATASTORE_BOOTSTRAP_FILES` (e.g. production).
///
/// # Returns
///
/// * `Ok(())` if the schema was written
/// * `Err(ChaosError::InternalServerError)` if the SpiceDB call fails. This
/// can be due to missing env variables, an invalid endpoint or a schema without
/// the proper `schema: |-` marker.
pub async fn migrate_schema() -> Result<(), ChaosError> {
    let endpoint =
        std::env::var("SPICEDB_GRPC_ENDPOINT").expect("SPICEDB_GRPC_ENDPOINT must be set");
    let key = std::env::var("SPICEDB_KEY").expect("SPICEDB_KEY must be set");
    let channel = Channel::from_shared(endpoint)
        .expect("SPICEDB_GRPC_ENDPOINT must be a valid URI")
        .connect_lazy();
    let mut client = SchemaServiceClient::new(channel);

    // schema.yaml holds a single `schema: |-` block scalar; strip the
    // header and the block's 2-space indentation instead of pulling in a YAML dep.
    let schema = include_str!("../../../spicedb/schema.yaml")
        .split_once("schema: |-")
        .expect("spicedb/schema.yaml must contain `schema: |-`")
        .1
        .lines()
        .map(|line| line.strip_prefix("  ").unwrap_or(line))
        .collect::<Vec<_>>()
        .join("\n")
        .trim()
        .to_owned();

    // This call can block the server binding to port 8080 as migrate_schema() is called before in main.rs
    // however this is expected behaviour as an unresponsive SpiceDB should prevent the server from running.
    let request = authorized_request(WriteSchemaRequest { schema }, &key)?;
    client
        .write_schema(request)
        .await
        .map_err(|_| ChaosError::InternalServerError)?;
    Ok(())
}

/// Checks whether a user holds a permission on a SpiceDB resource.
///
/// Performs a `CheckPermission` RPC for the subject `chaos/user:<user_id>`
/// against the object `<resource_type>:<resource_id>`.
///
/// Consistency depends on if a ZedToken is available, so results may be
/// slightly stale at initial startup; Once the app gets a ZedToken, it will
/// remain consistent with new writes for future reads.
///
/// # Arguments
///
/// * `client` - Shared SpiceDB permissions client from [`AppState`]
/// * `key` - Bearer token used to authenticate with SpiceDB
/// * `zedtoken` - The ZedToken, if any
/// * `user_id` - Chaos user to authorize
/// * `resource_type` - SpiceDB object type, such as `chaos/organisation`
/// * `resource_id` - Chaos ID of the resource, sent as the SpiceDB object ID
/// * `permission` - SpiceDB permission to check, such as `manage`
///
/// # Returns
///
/// * `Ok(())` if the user holds the permission
/// * `Err(ChaosError::ForbiddenOperation)` if the user does not
/// * `Err(ChaosError::InternalServerError)` if the SpiceDB call fails
pub async fn check_permission(
    client: &PermissionsServiceClient<Channel>,
    key: &str,
    zedtoken: &RwLock<Option<ZedToken>>,
    user_id: i64,
    resource_type: &str,
    resource_id: i64,
    permission: &str,
) -> Result<(), ChaosError> {
    let request = authorized_request(
        CheckPermissionRequest {
            consistency: Some(consistency_from_stored(zedtoken)),
            resource: Some(ObjectReference {
                object_type: resource_type.to_owned(),
                object_id: resource_id.to_string(),
            }),
            permission: permission.to_owned(),
            subject: Some(SubjectReference {
                object: Some(ObjectReference {
                    object_type: "chaos/user".to_owned(),
                    object_id: user_id.to_string(),
                }),
                optional_relation: String::new(),
            }),
            context: None,
            with_tracing: false,
        },
        key,
    )?;

    let response = client
        .clone()
        .check_permission(request)
        .await
        .map_err(|_| ChaosError::InternalServerError)?
        .into_inner();

    // Not storing into zedtoken as this might be a stale read at startup

    match Permissionship::try_from(response.permissionship) {
        Ok(Permissionship::HasPermission) => Ok(()),
        _ => Err(ChaosError::ForbiddenOperation),
    }
}

/// Builds a SpiceDB relationship update for the relationship
/// `<resource_type>:<resource_id>#<relation>@<subject_type>:<subject_id>`,
/// e.g. `chaos/campaign:123#organisation@chaos/organisation:5`.
///
/// # Arguments
///
/// * `operation` - Whether to create or delete the relationship
/// * `resource_type` - SpiceDB object type of the resource, such as `chaos/campaign`
/// * `resource_id` - Chaos ID of the resource
/// * `relation` - SpiceDB relation on the resource, such as `organisation`
/// * `subject_type` - SpiceDB object type of the subject, such as `chaos/user`
/// * `subject_id` - Chaos ID of the subject
///
/// # Returns
///
/// * The populated [`RelationshipUpdate`], ready to queue or write
pub fn new_relationship_update(
    operation: Operation,
    resource_type: &str,
    resource_id: i64,
    relation: &str,
    subject_type: &str,
    subject_id: i64,
) -> RelationshipUpdate {
    RelationshipUpdate {
        operation: operation as i32,
        relationship: Some(Relationship {
            resource: Some(ObjectReference {
                object_type: resource_type.to_owned(),
                object_id: resource_id.to_string(),
            }),
            relation: relation.to_owned(),
            subject: Some(SubjectReference {
                object: Some(ObjectReference {
                    object_type: subject_type.to_owned(),
                    object_id: subject_id.to_string(),
                }),
                optional_relation: String::new(),
            }),
            optional_caveat: None,
            optional_expires_at: None,
        }),
    }
}

/// Builds the inverse of a relationship update (create becomes delete and vice
/// versa), used to compensate writes that must be undone.
///
/// # Arguments
///
/// * `update` - The update to invert
///
/// # Returns
///
/// * `Some` inverse update for create/delete updates, `None` for anything else
pub fn invert_relationship_update(update: &RelationshipUpdate) -> Option<RelationshipUpdate> {
    let operation = match Operation::try_from(update.operation) {
        Ok(Operation::Create) => Operation::Delete,
        Ok(Operation::Delete) => Operation::Create,
        _ => return None,
    };

    Some(RelationshipUpdate {
        operation: operation as i32,
        relationship: update.relationship.clone(),
    })
}

/// Writes a batch of relationship updates to SpiceDB atomically.
///
/// All updates in the batch are applied in a single SpiceDB transaction, so
/// either every update lands or none do. Note that creating a relationship
/// that already exists, or deleting one that does not, fails the whole batch.
///
/// # Arguments
///
/// * `client` - Shared SpiceDB permissions client from [`AppState`]
/// * `key` - Bearer token used to authenticate with SpiceDB
/// * `updates` - The relationship updates to apply; an empty batch is a no-op
///
/// # Returns
///
/// * `Ok(Option<ZedToken>)` if the batch was applied, a new ZedToken is returned
/// * `Err(ChaosError::InternalServerError)` if the SpiceDB call fails
pub async fn write_relationships(
    client: &PermissionsServiceClient<Channel>,
    key: &str,
    updates: Vec<RelationshipUpdate>,
) -> Result<Option<ZedToken>, ChaosError> {
    if updates.is_empty() {
        return Ok(None);
    }

    let request = authorized_request(
        WriteRelationshipsRequest {
            updates,
            optional_preconditions: Vec::new(),
            optional_transaction_metadata: None,
        },
        key,
    )?;

    let response = client
        .clone()
        .write_relationships(request)
        .await
        .map_err(|_| ChaosError::InternalServerError)?
        .into_inner();

    Ok(response.written_at)
}

/// WARNING: This cannot be undone, so run after Postgres commit
/// Deletes all relationships for a given resource, where the
/// relationship is the resource OR the subject.
///
/// Performs two `DeleteRelationships` RPCs: one removing every relationship
/// where the resource appears on the left-hand side
/// (`<resource_type>:<resource_id>#relation@<any>`), and one removing every
/// relationship where it appears as the subject
/// (`<any>#relation@<resource_type>:<resource_id>`). SpiceDB cannot express
/// both directions in a single filter, hence two calls; each is atomic and
/// idempotent. This does not use the standard queue in [`DBTransaction`]
/// as it cannot be undone, hence, it is outside [`DBTransaction`].
///
/// # Arguments
///
/// * `client` - SpiceDB permissions service client
/// * `key` - Bearer token for SpiceDB authentication
/// * `resource_type` - SpiceDB object type, such as `chaos/organisation`
/// * `resource_id` - Chaos ID of the resource
///
/// # Returns
///
/// * `Ok(Option<ZedToken>)` if all relationships were deleted, a new ZedToken is returned
/// * `Err(ChaosError::InternalServerError)` on gRPC failure
pub async fn delete_all_resource_relationships(
    client: &PermissionsServiceClient<Channel>,
    key: &str,
    resource_type: &str,
    resource_id: i64,
) -> Result<Option<ZedToken>, ChaosError> {
    // Delete all where <resource_type>:<resource_id>#relation@<anything>
    let resource_request = authorized_request(
        DeleteRelationshipsRequest {
            relationship_filter: Some(RelationshipFilter {
                resource_type: resource_type.to_owned(),
                optional_resource_id: resource_id.to_string(),
                optional_resource_id_prefix: String::new(),
                optional_relation: String::new(),
                optional_subject_filter: None,
            }),
            optional_preconditions: Vec::new(),
            optional_limit: 0,
            optional_allow_partial_deletions: false,
            optional_transaction_metadata: None,
        },
        key,
    )?;

    client
        .clone()
        .delete_relationships(resource_request)
        .await
        .map_err(|_| ChaosError::InternalServerError)?
        .into_inner();

    // Delete all where <anything>#relation@<type>:<id>
    let subject_request = authorized_request(
        DeleteRelationshipsRequest {
            relationship_filter: Some(RelationshipFilter {
                resource_type: String::new(),
                optional_resource_id: String::new(),
                optional_resource_id_prefix: String::new(),
                optional_relation: String::new(),
                optional_subject_filter: Some(SubjectFilter {
                    subject_type: resource_type.to_owned(),
                    optional_subject_id: resource_id.to_string(),
                    optional_relation: None,
                }),
            }),
            optional_preconditions: Vec::new(),
            optional_limit: 0,
            optional_allow_partial_deletions: false,
            optional_transaction_metadata: None,
        },
        key,
    )?;

    let response2 = client
        .clone()
        .delete_relationships(subject_request)
        .await
        .map_err(|_| ChaosError::InternalServerError)?
        .into_inner();

    // Only return newest ZedToken
    Ok(response2.deleted_at)
}

/// Describes a SpiceDB authorization policy for the [`SpiceDbAuth`] extractor.
///
/// Each policy is a zero-sized type configuring which permission is checked on
/// which SpiceDB resource type, and which Axum path parameter holds the
/// resource ID. See [`policies`] for the available policies and how to add new
/// ones.
pub trait SpiceDbPolicy: Send + Sync {
    /// SpiceDB resource type, such as `chaos/organisation`.
    const RESOURCE_TYPE: &'static str;

    /// Permission to check, such as `manage`.
    const PERMISSION: &'static str;

    /// Name of the Axum route parameter containing the resource ID, such as
    /// `organisation_id`.
    const PATH_PARAMETER: &'static str;
}

/// Axum extractor that authorizes the authenticated user against the SpiceDB
/// policy `P`.
///
/// The extractor resolves the caller's user ID from the session JWT, reads the
/// resource ID from the path parameter named by [`SpiceDbPolicy::PATH_PARAMETER`]
/// and performs a SpiceDB permission check. Extraction fails with
/// [`ChaosError::NotLoggedIn`] for anonymous requests, [`ChaosError::BadRequest`]
/// when the path parameter is missing or not an integer, and
/// [`ChaosError::ForbiddenOperation`] when the permission check fails.
///
/// # Example
///
/// ```ignore
/// use crate::spicedb::{policies::ManageCampaign, SpiceDbAuth};
///
/// async fn update_campaign(auth: SpiceDbAuth<ManageCampaign>, ...) {
///     // `auth.user_id` is authorized to `manage` the campaign `auth.resource_id`.
/// }
/// ```
pub struct SpiceDbAuth<P> {
    /// Authenticated Chaos user ID.
    pub user_id: i64,

    /// Resource ID extracted from the path parameter named by `P::PATH_PARAMETER`.
    pub resource_id: i64,

    // Zero-sized marker tying this authorization to policy `P`. Private so a
    // `SpiceDbAuth` can only be constructed by the extractor below.
    policy: PhantomData<P>,
}

#[async_trait]
impl<S, P> FromRequestParts<S> for SpiceDbAuth<P>
where
    AppState: FromRef<S>,
    S: Send + Sync,
    P: SpiceDbPolicy,
{
    type Rejection = ChaosError;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let app_state = AppState::from_ref(state);

        let user_id = extract_user_id_from_request(parts, &app_state).await?;

        // If resource is the Chaos Platform, use const platform resource id
        let resource_id = match P::RESOURCE_TYPE {
            "chaos/platform" => PLATFORM_RESOURCE_ID,
            _ => {
                let parameters = parts
                    .extract::<Path<HashMap<String, i64>>>()
                    .await
                    .map_err(|_| ChaosError::BadRequest)?;

                *parameters
                    .get(P::PATH_PARAMETER)
                    .ok_or(ChaosError::BadRequest)?
            }
        };

        check_permission(
            &app_state.spicedb,
            &app_state.spicedb_key,
            &app_state.spicedb_zedtoken,
            user_id,
            P::RESOURCE_TYPE,
            resource_id,
            P::PERMISSION,
        )
        .await?;

        Ok(Self {
            user_id,
            resource_id,
            policy: PhantomData,
        })
    }
}
