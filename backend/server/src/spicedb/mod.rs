//! SpiceDB gRPC API bindings and authorization helpers.
//!
//! The modules under this one (except [`policies`]) are generated from the
//! Authzed protobuf definitions by `buf` (see `backend/buf.gen.yaml`) and
//! should not be edited by hand. The handwritten code below provides the
//! authorization building blocks used by HTTP handlers:
//!
//! * [`SpiceDbAuth`] - an Axum extractor that authorizes a request against a
//!   [`SpiceDbPolicy`] via a SpiceDB permission check.
//! * [`AppState::check_permission`] - a convenience method for permission
//!   checks where the resource ID does not come from a path parameter.

pub mod policies;

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

// Place the handwritten SpiceDB authorization code below this point.

use std::{collections::HashMap, marker::PhantomData};

use axum::{
    async_trait,
    extract::{FromRef, FromRequestParts, Path},
    http::request::Parts,
    RequestPartsExt,
};
use tonic::{metadata::MetadataValue, transport::Channel, Request};

use crate::{
    models::{app::AppState, error::ChaosError},
    service::auth::extract_user_id_from_request,
    spicedb::authzed::api::v1::{
        check_permission_response::Permissionship, consistency::Requirement,
        permissions_service_client::PermissionsServiceClient, CheckPermissionRequest, Consistency,
        ObjectReference, SubjectReference,
    },
};

/// Checks whether a user holds a permission on a SpiceDB resource.
///
/// Performs a `CheckPermission` RPC for the subject `chaos/user:<user_id>`
/// against the object `<resource_type>:<resource_id>`.
///
/// Consistency is `minimize_latency`, so results may be slightly stale; this
/// is appropriate for request authorization but not for checks immediately
/// following a relationship write.
///
/// # Arguments
///
/// * `client` - Shared SpiceDB permissions client from [`AppState`]
/// * `key` - Bearer token used to authenticate with SpiceDB
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
    user_id: i64,
    resource_type: &str,
    resource_id: i64,
    permission: &str,
) -> Result<(), ChaosError> {
    let mut request = Request::new(CheckPermissionRequest {
        consistency: Some(Consistency {
            requirement: Some(Requirement::MinimizeLatency(true)),
        }),
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
    });

    let authorization = format!("Bearer {key}")
        .parse::<MetadataValue<_>>()
        .map_err(|_| ChaosError::InternalServerError)?;
    request
        .metadata_mut()
        .insert("authorization", authorization);

    let response = client
        .clone()
        .check_permission(request)
        .await
        .map_err(|_| ChaosError::InternalServerError)?
        .into_inner();

    match Permissionship::try_from(response.permissionship) {
        Ok(Permissionship::HasPermission) => Ok(()),
        _ => Err(ChaosError::ForbiddenOperation),
    }
}

impl AppState {
    /// Checks whether a user holds a permission on a SpiceDB resource, using
    /// the application's shared SpiceDB client and credentials.
    ///
    /// Call this directly in handlers whose resource ID does not come from a
    /// path parameter, for example when the ID is taken from the request body,
    /// derived from a slug, or only known after a database lookup. When the
    /// resource ID is a path parameter, prefer the [`SpiceDbAuth`] extractor.
    ///
    /// # Arguments
    ///
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
        &self,
        user_id: i64,
        resource_type: &str,
        resource_id: i64,
        permission: &str,
    ) -> Result<(), ChaosError> {
        check_permission(
            &self.spicedb,
            &self.spicedb_key,
            user_id,
            resource_type,
            resource_id,
            permission,
        )
        .await
    }
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
///     // `auth.user_id` is authorized to manage the campaign `auth.resource_id`.
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

        let parameters = parts
            .extract::<Path<HashMap<String, i64>>>()
            .await
            .map_err(|_| ChaosError::BadRequest)?;

        let resource_id = *parameters
            .get(P::PATH_PARAMETER)
            .ok_or(ChaosError::BadRequest)?;

        check_permission(
            &app_state.spicedb,
            &app_state.spicedb_key,
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
