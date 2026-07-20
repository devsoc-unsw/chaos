//! Generated SpiceDB gRPC API bindings.

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

/// Checks whether a user has a permission on a SpiceDB resource.
async fn require_permission(
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
                object_type: "user".to_owned(),
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

/// Describes a SpiceDB authorization policy.
pub trait SpiceDbPolicy: Send + Sync {
    /// SpiceDB resource type, such as `chaos/organisation`.
    const RESOURCE_TYPE: &'static str;

    /// Permission to check, such as `manage`.
    const PERMISSION: &'static str;

    /// Name of the Axum route parameter containing the resource ID.
    const PATH_PARAMETER: &'static str;
}

/// Successful authorization for a SpiceDB policy.
pub struct SpiceDbAuth<P> {
    /// Authenticated Chaos user ID.
    pub user_id: i64,

    /// Resource ID extracted from the request path.
    pub resource_id: i64,

    /// Policy represented by this extractor.
    pub policy: PhantomData<P>,
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

        require_permission(
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

#[macro_export]
macro_rules! spicedb_policy {
    (
        $name:ident,
        resource = $resource:literal,
        permission = $permission:literal,
        path = $path:literal
    ) => {
        pub struct $name;

        impl $crate::spicedb::SpiceDbPolicy for $name {
            const RESOURCE_TYPE: &'static str = $resource;
            const PERMISSION: &'static str = $permission;
            const PATH_PARAMETER: &'static str = $path;
        }
    };
}
