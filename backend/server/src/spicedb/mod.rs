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
    #[allow(dead_code)]
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
    #[allow(dead_code)]
    pub mod api {
        include!("generated/google/api/google.api.rs");
    }

    pub mod rpc {
        include!("generated/google/rpc/google.rpc.rs");
    }
}

pub mod validate {
    #[allow(dead_code)]
    include!("generated/validate/validate.rs");
}

pub mod buf {
    #[allow(dead_code)]
    pub mod validate {
        include!("generated/buf/validate/buf.validate.rs");
    }
}

pub mod grpc {
    #[allow(dead_code)]
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
use tokio::sync::mpsc::{UnboundedReceiver, UnboundedSender};
use tonic::{metadata::MetadataValue, transport::Channel, Request};

use crate::spicedb::authzed::api::v1::{
    schema_service_client::SchemaServiceClient, DeleteRelationshipsRequest,
    ReadRelationshipsRequest, RelationshipFilter, SubjectFilter, WriteSchemaRequest, ZedToken,
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

/// Applies published ZedTokens to the shared freshness boundary.
///
/// This task is the only writer of the stored token in
/// [`AppState::spicedb_zedtoken`]. Every SpiceDB write originates in this
/// process, either from a request handler ([`DBTransaction::commit`],
/// [`delete_all_resource_relationships`]) or from the Sequin sync webhook, and
/// each sends the ZedToken its write RPC returned over
/// [`AppState::spicedb_token_tx`]. Routing them through one task keeps a
/// single writer, so the token is applied in the order it was published and no
/// two senders can race to overwrite each other.
///
/// Tokens are never compared. ZedTokens are opaque and not reliably ordered
/// (see the Authzed issue requesting a compare API), so two concurrent writes
/// can publish their tokens out of order and leave the boundary briefly stale.
/// A stale token still reads correctly from its own revision, but
/// `at_least_as_fresh` can then be served a snapshot older than a recent grant
/// or revocation, so permission results may be briefly stale until the next
/// write publishes again.
///
/// Before the first write the token is unset, and [`consistency_from_stored`]
/// falls back to `MinimizeLatency` until one arrives.
///
/// # Arguments
///
/// * `zedtoken` - The ZedToken lock in `AppState`
/// * `token_rx` - Receiver for tokens sent by write paths, owned here for the
///   lifetime of the task so a token published just before shutdown is applied
///
/// # Returns
///
/// Never returns while a sender remains; exits once every sender is dropped
pub async fn apply_zedtokens(
    zedtoken: Arc<RwLock<Option<ZedToken>>>,
    mut token_rx: UnboundedReceiver<ZedToken>,
) {
    while let Some(token) = token_rx.recv().await {
        *zedtoken.write().unwrap() = Some(token);
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
/// This is an idempotent upsert of the full schema, and is the only thing that
/// applies it: SpiceDB is deliberately not bootstrapped, because bootstrap
/// overwrite would replace the schema on every SpiceDB restart and deleting a
/// definition deletes its relationships, silently discarding everything Sequin
/// had synced.
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

    // Deliberately not published to the token task: a check's response ZedToken
    // reflects when the read was served, not a write, so publishing it would
    // move the boundary backwards on a stale read.

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

/// Builds a delete for a relationship exactly as it was read back from SpiceDB.
///
/// Used by the reconciliation sweep, which already holds the
/// [`Relationship`] it wants removed. Cloning it verbatim is safer than
/// reconstructing it from a hand-maintained list of schema constants, which
/// could drift from the names SpiceDB actually stores.
///
/// # Arguments
///
/// * `relationship` - The relationship to remove
///
/// # Returns
///
/// * A [`RelationshipUpdate`] deleting that relationship
pub fn delete_relationship(relationship: &Relationship) -> RelationshipUpdate {
    RelationshipUpdate {
        operation: Operation::Delete as i32,
        relationship: Some(relationship.clone()),
    }
}

/// Writes a batch of relationship updates to SpiceDB atomically.
///
/// All updates in the batch are applied in a single SpiceDB transaction, so
/// either every update lands or none do. Creating a relationship that already
/// exists fails the whole batch, which is why replay-safe callers use `Touch`
/// (an idempotent upsert) rather than `Create`. Deleting a relationship that
/// does not exist is a silent no-op.
///
/// One call also rejects two updates to the same relationship
/// (`ERROR_REASON_UPDATES_ON_SAME_RELATIONSHIP`), so a caller must coalesce
/// repeated changes to one relationship into a single operation before sending.
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

/// Reads every written relationship of one resource type.
///
/// Used by the reconciliation sweep to compare what SpiceDB holds against what
/// Postgres justifies. Only *written* relationships are returned; computed
/// subject sets from a permission query are not, so a caller that diffs the
/// result against its own mapping will not trip over derived data.
///
/// Reads at the stored freshness boundary, so a relationship written moments ago
/// may not appear yet. That is the safe direction for a diff: a stale read can
/// only make the set of orphans look smaller, never larger.
///
/// # Arguments
///
/// * `client` - SpiceDB permissions service client
/// * `key` - Bearer token for SpiceDB authentication
/// * `zedtoken` - The ZedToken lock in `AppState`, used for read consistency
/// * `resource_type` - SpiceDB object type to read, such as `chaos/organisation`
///
/// # Returns
///
/// * `Ok(Vec<Relationship>)` with every written relationship of that type
/// * `Err(ChaosError)` on gRPC failure
pub async fn read_relationships_of_type(
    client: &PermissionsServiceClient<Channel>,
    key: &str,
    zedtoken: &RwLock<Option<ZedToken>>,
    resource_type: &str,
) -> Result<Vec<Relationship>, ChaosError> {
    let request = authorized_request(
        ReadRelationshipsRequest {
            consistency: Some(consistency_from_stored(zedtoken)),
            // An empty resource ID and subject filter make this a wildcard over
            // the whole resource type.
            relationship_filter: Some(RelationshipFilter {
                resource_type: resource_type.to_owned(),
                optional_resource_id: String::new(),
                optional_resource_id_prefix: String::new(),
                optional_relation: String::new(),
                optional_subject_filter: None,
            }),
            optional_limit: 0,
            optional_cursor: None,
        },
        key,
    )?;

    let mut stream = client
        .clone()
        .read_relationships(request)
        .await
        .map_err(|_| ChaosError::InternalServerError)?
        .into_inner();

    let mut relationships = Vec::new();
    while let Some(response) = stream
        .message()
        .await
        .map_err(|_| ChaosError::InternalServerError)?
    {
        if let Some(relationship) = response.relationship {
            relationships.push(relationship);
        }
    }

    Ok(relationships)
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
/// The deletion's ZedToken is sent to the token task so the revocation is
/// visible to later permission checks.
///
/// # Arguments
///
/// * `client` - SpiceDB permissions service client
/// * `key` - Bearer token for SpiceDB authentication
/// * `resource_type` - SpiceDB object type, such as `chaos/organisation`
/// * `resource_id` - Chaos ID of the resource
/// * `token_tx` - Channel used to publish the deletion's ZedToken
///
/// # Returns
///
/// * `Ok(())` if all relationships were deleted
/// * `Err(ChaosError::InternalServerError)` on gRPC failure
pub async fn delete_all_resource_relationships(
    client: &PermissionsServiceClient<Channel>,
    key: &str,
    resource_type: &str,
    resource_id: i64,
    token_tx: &UnboundedSender<ZedToken>,
) -> Result<(), ChaosError> {
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

    let response = client
        .clone()
        .delete_relationships(subject_request)
        .await
        .map_err(|_| ChaosError::InternalServerError)?
        .into_inner();

    // The second RPC has the newest revision, so its token supersedes the
    // first one's. A closed channel means the token task has exited, so the
    // token is dropped and the boundary stays where it was.
    if let Some(token) = response.deleted_at {
        let _ = token_tx.send(token);
    }

    Ok(())
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
