//! Isolated real tonic transport fixture; it does not modify any SpiceDB instance.

use crate::spicedb::authzed::api::v1::*;
use permissions_service_server::{PermissionsService, PermissionsServiceServer};
use tonic::{Request, Response, Status};

/// Permission server with deterministic grant, denial, and gRPC failure responses.
#[derive(Default)]
struct Fixture;

#[tonic::async_trait]
impl PermissionsService for Fixture {
    type ReadRelationshipsStream = tokio_stream::Empty<Result<ReadRelationshipsResponse, Status>>;
    type LookupResourcesStream = tokio_stream::Empty<Result<LookupResourcesResponse, Status>>;
    type LookupSubjectsStream = tokio_stream::Empty<Result<LookupSubjectsResponse, Status>>;
    type ExportBulkRelationshipsStream =
        tokio_stream::Empty<Result<ExportBulkRelationshipsResponse, Status>>;
    /// Validates authentication without logging metadata and returns the chosen permission result.
    async fn check_permission(
        &self,
        request: Request<CheckPermissionRequest>,
    ) -> Result<Response<CheckPermissionResponse>, Status> {
        assert_eq!(
            request.metadata().get("authorization").unwrap(),
            "Bearer PRIVATE_KEY"
        );
        assert!(
            request.metadata().get("traceparent").is_none(),
            "outgoing propagation is intentionally not implemented"
        );
        let request = request.into_inner();
        let id = request.resource.unwrap().object_id;
        if id == "3" {
            return Err(Status::unavailable("PRIVATE_INTERNAL"));
        }
        Ok(Response::new(CheckPermissionResponse {
            permissionship: if id == "2" {
                check_permission_response::Permissionship::NoPermission as i32
            } else {
                check_permission_response::Permissionship::HasPermission as i32
            },
            ..Default::default()
        }))
    }
    /// Accepts only the fixture's relationship write and returns a private test token.
    async fn write_relationships(
        &self,
        request: Request<WriteRelationshipsRequest>,
    ) -> Result<Response<WriteRelationshipsResponse>, Status> {
        assert_eq!(
            request.metadata().get("authorization").unwrap(),
            "Bearer PRIVATE_KEY"
        );
        assert_eq!(request.get_ref().updates.len(), 1);
        Ok(Response::new(WriteRelationshipsResponse {
            written_at: Some(ZedToken {
                token: "PRIVATE_ZEDTOKEN".into(),
            }),
        }))
    }
    /// Rejects unused fixture operations.
    async fn read_relationships(
        &self,
        _: Request<ReadRelationshipsRequest>,
    ) -> Result<Response<Self::ReadRelationshipsStream>, Status> {
        Err(Status::unimplemented("unused fixture operation"))
    }
    /// Rejects unused fixture operations.
    async fn delete_relationships(
        &self,
        _: Request<DeleteRelationshipsRequest>,
    ) -> Result<Response<DeleteRelationshipsResponse>, Status> {
        Err(Status::unimplemented("unused fixture operation"))
    }
    /// Rejects unused fixture operations.
    async fn check_bulk_permissions(
        &self,
        _: Request<CheckBulkPermissionsRequest>,
    ) -> Result<Response<CheckBulkPermissionsResponse>, Status> {
        Err(Status::unimplemented("unused fixture operation"))
    }
    /// Rejects unused fixture operations.
    async fn expand_permission_tree(
        &self,
        _: Request<ExpandPermissionTreeRequest>,
    ) -> Result<Response<ExpandPermissionTreeResponse>, Status> {
        Err(Status::unimplemented("unused fixture operation"))
    }
    /// Rejects unused fixture operations.
    async fn lookup_resources(
        &self,
        _: Request<LookupResourcesRequest>,
    ) -> Result<Response<Self::LookupResourcesStream>, Status> {
        Err(Status::unimplemented("unused fixture operation"))
    }
    /// Rejects unused fixture operations.
    async fn lookup_subjects(
        &self,
        _: Request<LookupSubjectsRequest>,
    ) -> Result<Response<Self::LookupSubjectsStream>, Status> {
        Err(Status::unimplemented("unused fixture operation"))
    }
    /// Rejects unused fixture operations.
    async fn import_bulk_relationships(
        &self,
        _: Request<tonic::Streaming<ImportBulkRelationshipsRequest>>,
    ) -> Result<Response<ImportBulkRelationshipsResponse>, Status> {
        Err(Status::unimplemented("unused fixture operation"))
    }
    /// Rejects unused fixture operations.
    async fn export_bulk_relationships(
        &self,
        _: Request<ExportBulkRelationshipsRequest>,
    ) -> Result<Response<Self::ExportBulkRelationshipsStream>, Status> {
        Err(Status::unimplemented("unused fixture operation"))
    }
}

/// Binds an ephemeral local port and returns a real client plus bounded shutdown handles.
pub(super) async fn start() -> anyhow::Result<(
    permissions_service_client::PermissionsServiceClient<tonic::transport::Channel>,
    tokio::sync::oneshot::Sender<()>,
    tokio::task::JoinHandle<Result<(), tonic::transport::Error>>,
)> {
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await?;
    let address = listener.local_addr()?;
    let (stop, stopped) = tokio::sync::oneshot::channel();
    let server = tokio::spawn(async move {
        tonic::transport::Server::builder()
            .add_service(PermissionsServiceServer::new(Fixture))
            .serve_with_incoming_shutdown(
                tokio_stream::wrappers::TcpListenerStream::new(listener),
                async {
                    let _ = stopped.await;
                },
            )
            .await
    });
    let channel = tonic::transport::Endpoint::from_shared(format!("http://{address}"))?
        .connect_timeout(std::time::Duration::from_secs(3))
        .timeout(std::time::Duration::from_secs(3))
        .connect()
        .await?;
    Ok((
        permissions_service_client::PermissionsServiceClient::new(channel),
        stop,
        server,
    ))
}
