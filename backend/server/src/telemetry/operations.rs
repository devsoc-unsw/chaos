//! Application-owned operation spans where dependencies do not emit client spans.

use std::future::Future;
use tracing::Instrument;

/// Creates a PostgreSQL client span with a static operation label, never SQL or bind values.
pub fn database_span(operation: &'static str) -> tracing::Span {
    tracing::debug_span!(
        "db.postgres.query",
        otel.kind = "client",
        db.system.name = "postgresql",
        db.operation.name = operation
    )
}

/// Times a SpiceDB RPC future and records its gRPC result code without request data.
/// Returns the original response/error and does not add outgoing trace metadata.
pub async fn spicedb_rpc<T>(
    method: &'static str,
    call: impl Future<Output = Result<T, tonic::Status>>,
) -> Result<T, tonic::Status> {
    let span = tracing::debug_span!(
        "rpc.grpc.client",
        otel.kind = "client",
        rpc.system = "grpc",
        rpc.service = "authzed.api.v1.PermissionsService",
        rpc.method = method,
        rpc.grpc.status_code = tracing::field::Empty,
        otel.status_code = tracing::field::Empty
    );
    async move {
        let result = call.await;
        let code = result.as_ref().err().map_or(0, |error| error.code() as i32);
        tracing::Span::current().record("rpc.grpc.status_code", code);
        if code != 0 {
            tracing::Span::current().record("otel.status_code", "ERROR");
        }
        result
    }
    .instrument(span)
    .await
}
