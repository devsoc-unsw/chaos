// @generated
/// Generated client implementations.
pub mod permissions_service_client {
    #![allow(
        unused_variables,
        dead_code,
        missing_docs,
        clippy::wildcard_imports,
        clippy::let_unit_value,
    )]
    use tonic::codegen::*;
    use tonic::codegen::http::Uri;
    #[derive(Debug, Clone)]
    pub struct PermissionsServiceClient<T> {
        inner: tonic::client::Grpc<T>,
    }
    impl PermissionsServiceClient<tonic::transport::Channel> {
        /// Attempt to create a new client by connecting to a given endpoint.
        pub async fn connect<D>(dst: D) -> Result<Self, tonic::transport::Error>
        where
            D: TryInto<tonic::transport::Endpoint>,
            D::Error: Into<StdError>,
        {
            let conn = tonic::transport::Endpoint::new(dst)?.connect().await?;
            Ok(Self::new(conn))
        }
    }
    impl<T> PermissionsServiceClient<T>
    where
        T: tonic::client::GrpcService<tonic::body::Body>,
        T::Error: Into<StdError>,
        T::ResponseBody: Body<Data = Bytes> + std::marker::Send + 'static,
        <T::ResponseBody as Body>::Error: Into<StdError> + std::marker::Send,
    {
        pub fn new(inner: T) -> Self {
            let inner = tonic::client::Grpc::new(inner);
            Self { inner }
        }
        pub fn with_origin(inner: T, origin: Uri) -> Self {
            let inner = tonic::client::Grpc::with_origin(inner, origin);
            Self { inner }
        }
        pub fn with_interceptor<F>(
            inner: T,
            interceptor: F,
        ) -> PermissionsServiceClient<InterceptedService<T, F>>
        where
            F: tonic::service::Interceptor,
            T::ResponseBody: Default,
            T: tonic::codegen::Service<
                http::Request<tonic::body::Body>,
                Response = http::Response<
                    <T as tonic::client::GrpcService<tonic::body::Body>>::ResponseBody,
                >,
            >,
            <T as tonic::codegen::Service<
                http::Request<tonic::body::Body>,
            >>::Error: Into<StdError> + std::marker::Send + std::marker::Sync,
        {
            PermissionsServiceClient::new(InterceptedService::new(inner, interceptor))
        }
        /// Compress requests with the given encoding.
        ///
        /// This requires the server to support it otherwise it might respond with an
        /// error.
        #[must_use]
        pub fn send_compressed(mut self, encoding: CompressionEncoding) -> Self {
            self.inner = self.inner.send_compressed(encoding);
            self
        }
        /// Enable decompressing responses.
        #[must_use]
        pub fn accept_compressed(mut self, encoding: CompressionEncoding) -> Self {
            self.inner = self.inner.accept_compressed(encoding);
            self
        }
        /// Limits the maximum size of a decoded message.
        ///
        /// Default: `4MB`
        #[must_use]
        pub fn max_decoding_message_size(mut self, limit: usize) -> Self {
            self.inner = self.inner.max_decoding_message_size(limit);
            self
        }
        /// Limits the maximum size of an encoded message.
        ///
        /// Default: `usize::MAX`
        #[must_use]
        pub fn max_encoding_message_size(mut self, limit: usize) -> Self {
            self.inner = self.inner.max_encoding_message_size(limit);
            self
        }
        pub async fn read_relationships(
            &mut self,
            request: impl tonic::IntoRequest<super::ReadRelationshipsRequest>,
        ) -> std::result::Result<
            tonic::Response<tonic::codec::Streaming<super::ReadRelationshipsResponse>>,
            tonic::Status,
        > {
            self.inner
                .ready()
                .await
                .map_err(|e| {
                    tonic::Status::unknown(
                        format!("Service was not ready: {}", e.into()),
                    )
                })?;
            let codec = tonic_prost::ProstCodec::default();
            let path = http::uri::PathAndQuery::from_static(
                "/authzed.api.v1.PermissionsService/ReadRelationships",
            );
            let mut req = request.into_request();
            req.extensions_mut()
                .insert(
                    GrpcMethod::new(
                        "authzed.api.v1.PermissionsService",
                        "ReadRelationships",
                    ),
                );
            self.inner.server_streaming(req, path, codec).await
        }
        pub async fn write_relationships(
            &mut self,
            request: impl tonic::IntoRequest<super::WriteRelationshipsRequest>,
        ) -> std::result::Result<
            tonic::Response<super::WriteRelationshipsResponse>,
            tonic::Status,
        > {
            self.inner
                .ready()
                .await
                .map_err(|e| {
                    tonic::Status::unknown(
                        format!("Service was not ready: {}", e.into()),
                    )
                })?;
            let codec = tonic_prost::ProstCodec::default();
            let path = http::uri::PathAndQuery::from_static(
                "/authzed.api.v1.PermissionsService/WriteRelationships",
            );
            let mut req = request.into_request();
            req.extensions_mut()
                .insert(
                    GrpcMethod::new(
                        "authzed.api.v1.PermissionsService",
                        "WriteRelationships",
                    ),
                );
            self.inner.unary(req, path, codec).await
        }
        pub async fn delete_relationships(
            &mut self,
            request: impl tonic::IntoRequest<super::DeleteRelationshipsRequest>,
        ) -> std::result::Result<
            tonic::Response<super::DeleteRelationshipsResponse>,
            tonic::Status,
        > {
            self.inner
                .ready()
                .await
                .map_err(|e| {
                    tonic::Status::unknown(
                        format!("Service was not ready: {}", e.into()),
                    )
                })?;
            let codec = tonic_prost::ProstCodec::default();
            let path = http::uri::PathAndQuery::from_static(
                "/authzed.api.v1.PermissionsService/DeleteRelationships",
            );
            let mut req = request.into_request();
            req.extensions_mut()
                .insert(
                    GrpcMethod::new(
                        "authzed.api.v1.PermissionsService",
                        "DeleteRelationships",
                    ),
                );
            self.inner.unary(req, path, codec).await
        }
        pub async fn check_permission(
            &mut self,
            request: impl tonic::IntoRequest<super::CheckPermissionRequest>,
        ) -> std::result::Result<
            tonic::Response<super::CheckPermissionResponse>,
            tonic::Status,
        > {
            self.inner
                .ready()
                .await
                .map_err(|e| {
                    tonic::Status::unknown(
                        format!("Service was not ready: {}", e.into()),
                    )
                })?;
            let codec = tonic_prost::ProstCodec::default();
            let path = http::uri::PathAndQuery::from_static(
                "/authzed.api.v1.PermissionsService/CheckPermission",
            );
            let mut req = request.into_request();
            req.extensions_mut()
                .insert(
                    GrpcMethod::new(
                        "authzed.api.v1.PermissionsService",
                        "CheckPermission",
                    ),
                );
            self.inner.unary(req, path, codec).await
        }
        pub async fn check_bulk_permissions(
            &mut self,
            request: impl tonic::IntoRequest<super::CheckBulkPermissionsRequest>,
        ) -> std::result::Result<
            tonic::Response<super::CheckBulkPermissionsResponse>,
            tonic::Status,
        > {
            self.inner
                .ready()
                .await
                .map_err(|e| {
                    tonic::Status::unknown(
                        format!("Service was not ready: {}", e.into()),
                    )
                })?;
            let codec = tonic_prost::ProstCodec::default();
            let path = http::uri::PathAndQuery::from_static(
                "/authzed.api.v1.PermissionsService/CheckBulkPermissions",
            );
            let mut req = request.into_request();
            req.extensions_mut()
                .insert(
                    GrpcMethod::new(
                        "authzed.api.v1.PermissionsService",
                        "CheckBulkPermissions",
                    ),
                );
            self.inner.unary(req, path, codec).await
        }
        pub async fn expand_permission_tree(
            &mut self,
            request: impl tonic::IntoRequest<super::ExpandPermissionTreeRequest>,
        ) -> std::result::Result<
            tonic::Response<super::ExpandPermissionTreeResponse>,
            tonic::Status,
        > {
            self.inner
                .ready()
                .await
                .map_err(|e| {
                    tonic::Status::unknown(
                        format!("Service was not ready: {}", e.into()),
                    )
                })?;
            let codec = tonic_prost::ProstCodec::default();
            let path = http::uri::PathAndQuery::from_static(
                "/authzed.api.v1.PermissionsService/ExpandPermissionTree",
            );
            let mut req = request.into_request();
            req.extensions_mut()
                .insert(
                    GrpcMethod::new(
                        "authzed.api.v1.PermissionsService",
                        "ExpandPermissionTree",
                    ),
                );
            self.inner.unary(req, path, codec).await
        }
        pub async fn lookup_resources(
            &mut self,
            request: impl tonic::IntoRequest<super::LookupResourcesRequest>,
        ) -> std::result::Result<
            tonic::Response<tonic::codec::Streaming<super::LookupResourcesResponse>>,
            tonic::Status,
        > {
            self.inner
                .ready()
                .await
                .map_err(|e| {
                    tonic::Status::unknown(
                        format!("Service was not ready: {}", e.into()),
                    )
                })?;
            let codec = tonic_prost::ProstCodec::default();
            let path = http::uri::PathAndQuery::from_static(
                "/authzed.api.v1.PermissionsService/LookupResources",
            );
            let mut req = request.into_request();
            req.extensions_mut()
                .insert(
                    GrpcMethod::new(
                        "authzed.api.v1.PermissionsService",
                        "LookupResources",
                    ),
                );
            self.inner.server_streaming(req, path, codec).await
        }
        pub async fn lookup_subjects(
            &mut self,
            request: impl tonic::IntoRequest<super::LookupSubjectsRequest>,
        ) -> std::result::Result<
            tonic::Response<tonic::codec::Streaming<super::LookupSubjectsResponse>>,
            tonic::Status,
        > {
            self.inner
                .ready()
                .await
                .map_err(|e| {
                    tonic::Status::unknown(
                        format!("Service was not ready: {}", e.into()),
                    )
                })?;
            let codec = tonic_prost::ProstCodec::default();
            let path = http::uri::PathAndQuery::from_static(
                "/authzed.api.v1.PermissionsService/LookupSubjects",
            );
            let mut req = request.into_request();
            req.extensions_mut()
                .insert(
                    GrpcMethod::new(
                        "authzed.api.v1.PermissionsService",
                        "LookupSubjects",
                    ),
                );
            self.inner.server_streaming(req, path, codec).await
        }
        pub async fn import_bulk_relationships(
            &mut self,
            request: impl tonic::IntoStreamingRequest<
                Message = super::ImportBulkRelationshipsRequest,
            >,
        ) -> std::result::Result<
            tonic::Response<super::ImportBulkRelationshipsResponse>,
            tonic::Status,
        > {
            self.inner
                .ready()
                .await
                .map_err(|e| {
                    tonic::Status::unknown(
                        format!("Service was not ready: {}", e.into()),
                    )
                })?;
            let codec = tonic_prost::ProstCodec::default();
            let path = http::uri::PathAndQuery::from_static(
                "/authzed.api.v1.PermissionsService/ImportBulkRelationships",
            );
            let mut req = request.into_streaming_request();
            req.extensions_mut()
                .insert(
                    GrpcMethod::new(
                        "authzed.api.v1.PermissionsService",
                        "ImportBulkRelationships",
                    ),
                );
            self.inner.client_streaming(req, path, codec).await
        }
        pub async fn export_bulk_relationships(
            &mut self,
            request: impl tonic::IntoRequest<super::ExportBulkRelationshipsRequest>,
        ) -> std::result::Result<
            tonic::Response<
                tonic::codec::Streaming<super::ExportBulkRelationshipsResponse>,
            >,
            tonic::Status,
        > {
            self.inner
                .ready()
                .await
                .map_err(|e| {
                    tonic::Status::unknown(
                        format!("Service was not ready: {}", e.into()),
                    )
                })?;
            let codec = tonic_prost::ProstCodec::default();
            let path = http::uri::PathAndQuery::from_static(
                "/authzed.api.v1.PermissionsService/ExportBulkRelationships",
            );
            let mut req = request.into_request();
            req.extensions_mut()
                .insert(
                    GrpcMethod::new(
                        "authzed.api.v1.PermissionsService",
                        "ExportBulkRelationships",
                    ),
                );
            self.inner.server_streaming(req, path, codec).await
        }
    }
}
/// Generated server implementations.
pub mod permissions_service_server {
    #![allow(
        unused_variables,
        dead_code,
        missing_docs,
        clippy::wildcard_imports,
        clippy::let_unit_value,
    )]
    use tonic::codegen::*;
    /// Generated trait containing gRPC methods that should be implemented for use with PermissionsServiceServer.
    #[async_trait]
    pub trait PermissionsService: std::marker::Send + std::marker::Sync + 'static {
        /// Server streaming response type for the ReadRelationships method.
        type ReadRelationshipsStream: tonic::codegen::tokio_stream::Stream<
                Item = std::result::Result<
                    super::ReadRelationshipsResponse,
                    tonic::Status,
                >,
            >
            + std::marker::Send
            + 'static;
        async fn read_relationships(
            &self,
            request: tonic::Request<super::ReadRelationshipsRequest>,
        ) -> std::result::Result<
            tonic::Response<Self::ReadRelationshipsStream>,
            tonic::Status,
        >;
        async fn write_relationships(
            &self,
            request: tonic::Request<super::WriteRelationshipsRequest>,
        ) -> std::result::Result<
            tonic::Response<super::WriteRelationshipsResponse>,
            tonic::Status,
        >;
        async fn delete_relationships(
            &self,
            request: tonic::Request<super::DeleteRelationshipsRequest>,
        ) -> std::result::Result<
            tonic::Response<super::DeleteRelationshipsResponse>,
            tonic::Status,
        >;
        async fn check_permission(
            &self,
            request: tonic::Request<super::CheckPermissionRequest>,
        ) -> std::result::Result<
            tonic::Response<super::CheckPermissionResponse>,
            tonic::Status,
        >;
        async fn check_bulk_permissions(
            &self,
            request: tonic::Request<super::CheckBulkPermissionsRequest>,
        ) -> std::result::Result<
            tonic::Response<super::CheckBulkPermissionsResponse>,
            tonic::Status,
        >;
        async fn expand_permission_tree(
            &self,
            request: tonic::Request<super::ExpandPermissionTreeRequest>,
        ) -> std::result::Result<
            tonic::Response<super::ExpandPermissionTreeResponse>,
            tonic::Status,
        >;
        /// Server streaming response type for the LookupResources method.
        type LookupResourcesStream: tonic::codegen::tokio_stream::Stream<
                Item = std::result::Result<super::LookupResourcesResponse, tonic::Status>,
            >
            + std::marker::Send
            + 'static;
        async fn lookup_resources(
            &self,
            request: tonic::Request<super::LookupResourcesRequest>,
        ) -> std::result::Result<
            tonic::Response<Self::LookupResourcesStream>,
            tonic::Status,
        >;
        /// Server streaming response type for the LookupSubjects method.
        type LookupSubjectsStream: tonic::codegen::tokio_stream::Stream<
                Item = std::result::Result<super::LookupSubjectsResponse, tonic::Status>,
            >
            + std::marker::Send
            + 'static;
        async fn lookup_subjects(
            &self,
            request: tonic::Request<super::LookupSubjectsRequest>,
        ) -> std::result::Result<
            tonic::Response<Self::LookupSubjectsStream>,
            tonic::Status,
        >;
        async fn import_bulk_relationships(
            &self,
            request: tonic::Request<
                tonic::Streaming<super::ImportBulkRelationshipsRequest>,
            >,
        ) -> std::result::Result<
            tonic::Response<super::ImportBulkRelationshipsResponse>,
            tonic::Status,
        >;
        /// Server streaming response type for the ExportBulkRelationships method.
        type ExportBulkRelationshipsStream: tonic::codegen::tokio_stream::Stream<
                Item = std::result::Result<
                    super::ExportBulkRelationshipsResponse,
                    tonic::Status,
                >,
            >
            + std::marker::Send
            + 'static;
        async fn export_bulk_relationships(
            &self,
            request: tonic::Request<super::ExportBulkRelationshipsRequest>,
        ) -> std::result::Result<
            tonic::Response<Self::ExportBulkRelationshipsStream>,
            tonic::Status,
        >;
    }
    #[derive(Debug)]
    pub struct PermissionsServiceServer<T> {
        inner: Arc<T>,
        accept_compression_encodings: EnabledCompressionEncodings,
        send_compression_encodings: EnabledCompressionEncodings,
        max_decoding_message_size: Option<usize>,
        max_encoding_message_size: Option<usize>,
    }
    impl<T> PermissionsServiceServer<T> {
        pub fn new(inner: T) -> Self {
            Self::from_arc(Arc::new(inner))
        }
        pub fn from_arc(inner: Arc<T>) -> Self {
            Self {
                inner,
                accept_compression_encodings: Default::default(),
                send_compression_encodings: Default::default(),
                max_decoding_message_size: None,
                max_encoding_message_size: None,
            }
        }
        pub fn with_interceptor<F>(
            inner: T,
            interceptor: F,
        ) -> InterceptedService<Self, F>
        where
            F: tonic::service::Interceptor,
        {
            InterceptedService::new(Self::new(inner), interceptor)
        }
        /// Enable decompressing requests with the given encoding.
        #[must_use]
        pub fn accept_compressed(mut self, encoding: CompressionEncoding) -> Self {
            self.accept_compression_encodings.enable(encoding);
            self
        }
        /// Compress responses with the given encoding, if the client supports it.
        #[must_use]
        pub fn send_compressed(mut self, encoding: CompressionEncoding) -> Self {
            self.send_compression_encodings.enable(encoding);
            self
        }
        /// Limits the maximum size of a decoded message.
        ///
        /// Default: `4MB`
        #[must_use]
        pub fn max_decoding_message_size(mut self, limit: usize) -> Self {
            self.max_decoding_message_size = Some(limit);
            self
        }
        /// Limits the maximum size of an encoded message.
        ///
        /// Default: `usize::MAX`
        #[must_use]
        pub fn max_encoding_message_size(mut self, limit: usize) -> Self {
            self.max_encoding_message_size = Some(limit);
            self
        }
    }
    impl<T, B> tonic::codegen::Service<http::Request<B>> for PermissionsServiceServer<T>
    where
        T: PermissionsService,
        B: Body + std::marker::Send + 'static,
        B::Error: Into<StdError> + std::marker::Send + 'static,
    {
        type Response = http::Response<tonic::body::Body>;
        type Error = std::convert::Infallible;
        type Future = BoxFuture<Self::Response, Self::Error>;
        fn poll_ready(
            &mut self,
            _cx: &mut Context<'_>,
        ) -> Poll<std::result::Result<(), Self::Error>> {
            Poll::Ready(Ok(()))
        }
        fn call(&mut self, req: http::Request<B>) -> Self::Future {
            match req.uri().path() {
                "/authzed.api.v1.PermissionsService/ReadRelationships" => {
                    #[allow(non_camel_case_types)]
                    struct ReadRelationshipsSvc<T: PermissionsService>(pub Arc<T>);
                    impl<
                        T: PermissionsService,
                    > tonic::server::ServerStreamingService<
                        super::ReadRelationshipsRequest,
                    > for ReadRelationshipsSvc<T> {
                        type Response = super::ReadRelationshipsResponse;
                        type ResponseStream = T::ReadRelationshipsStream;
                        type Future = BoxFuture<
                            tonic::Response<Self::ResponseStream>,
                            tonic::Status,
                        >;
                        fn call(
                            &mut self,
                            request: tonic::Request<super::ReadRelationshipsRequest>,
                        ) -> Self::Future {
                            let inner = Arc::clone(&self.0);
                            let fut = async move {
                                <T as PermissionsService>::read_relationships(
                                        &inner,
                                        request,
                                    )
                                    .await
                            };
                            Box::pin(fut)
                        }
                    }
                    let accept_compression_encodings = self.accept_compression_encodings;
                    let send_compression_encodings = self.send_compression_encodings;
                    let max_decoding_message_size = self.max_decoding_message_size;
                    let max_encoding_message_size = self.max_encoding_message_size;
                    let inner = self.inner.clone();
                    let fut = async move {
                        let method = ReadRelationshipsSvc(inner);
                        let codec = tonic_prost::ProstCodec::default();
                        let mut grpc = tonic::server::Grpc::new(codec)
                            .apply_compression_config(
                                accept_compression_encodings,
                                send_compression_encodings,
                            )
                            .apply_max_message_size_config(
                                max_decoding_message_size,
                                max_encoding_message_size,
                            );
                        let res = grpc.server_streaming(method, req).await;
                        Ok(res)
                    };
                    Box::pin(fut)
                }
                "/authzed.api.v1.PermissionsService/WriteRelationships" => {
                    #[allow(non_camel_case_types)]
                    struct WriteRelationshipsSvc<T: PermissionsService>(pub Arc<T>);
                    impl<
                        T: PermissionsService,
                    > tonic::server::UnaryService<super::WriteRelationshipsRequest>
                    for WriteRelationshipsSvc<T> {
                        type Response = super::WriteRelationshipsResponse;
                        type Future = BoxFuture<
                            tonic::Response<Self::Response>,
                            tonic::Status,
                        >;
                        fn call(
                            &mut self,
                            request: tonic::Request<super::WriteRelationshipsRequest>,
                        ) -> Self::Future {
                            let inner = Arc::clone(&self.0);
                            let fut = async move {
                                <T as PermissionsService>::write_relationships(
                                        &inner,
                                        request,
                                    )
                                    .await
                            };
                            Box::pin(fut)
                        }
                    }
                    let accept_compression_encodings = self.accept_compression_encodings;
                    let send_compression_encodings = self.send_compression_encodings;
                    let max_decoding_message_size = self.max_decoding_message_size;
                    let max_encoding_message_size = self.max_encoding_message_size;
                    let inner = self.inner.clone();
                    let fut = async move {
                        let method = WriteRelationshipsSvc(inner);
                        let codec = tonic_prost::ProstCodec::default();
                        let mut grpc = tonic::server::Grpc::new(codec)
                            .apply_compression_config(
                                accept_compression_encodings,
                                send_compression_encodings,
                            )
                            .apply_max_message_size_config(
                                max_decoding_message_size,
                                max_encoding_message_size,
                            );
                        let res = grpc.unary(method, req).await;
                        Ok(res)
                    };
                    Box::pin(fut)
                }
                "/authzed.api.v1.PermissionsService/DeleteRelationships" => {
                    #[allow(non_camel_case_types)]
                    struct DeleteRelationshipsSvc<T: PermissionsService>(pub Arc<T>);
                    impl<
                        T: PermissionsService,
                    > tonic::server::UnaryService<super::DeleteRelationshipsRequest>
                    for DeleteRelationshipsSvc<T> {
                        type Response = super::DeleteRelationshipsResponse;
                        type Future = BoxFuture<
                            tonic::Response<Self::Response>,
                            tonic::Status,
                        >;
                        fn call(
                            &mut self,
                            request: tonic::Request<super::DeleteRelationshipsRequest>,
                        ) -> Self::Future {
                            let inner = Arc::clone(&self.0);
                            let fut = async move {
                                <T as PermissionsService>::delete_relationships(
                                        &inner,
                                        request,
                                    )
                                    .await
                            };
                            Box::pin(fut)
                        }
                    }
                    let accept_compression_encodings = self.accept_compression_encodings;
                    let send_compression_encodings = self.send_compression_encodings;
                    let max_decoding_message_size = self.max_decoding_message_size;
                    let max_encoding_message_size = self.max_encoding_message_size;
                    let inner = self.inner.clone();
                    let fut = async move {
                        let method = DeleteRelationshipsSvc(inner);
                        let codec = tonic_prost::ProstCodec::default();
                        let mut grpc = tonic::server::Grpc::new(codec)
                            .apply_compression_config(
                                accept_compression_encodings,
                                send_compression_encodings,
                            )
                            .apply_max_message_size_config(
                                max_decoding_message_size,
                                max_encoding_message_size,
                            );
                        let res = grpc.unary(method, req).await;
                        Ok(res)
                    };
                    Box::pin(fut)
                }
                "/authzed.api.v1.PermissionsService/CheckPermission" => {
                    #[allow(non_camel_case_types)]
                    struct CheckPermissionSvc<T: PermissionsService>(pub Arc<T>);
                    impl<
                        T: PermissionsService,
                    > tonic::server::UnaryService<super::CheckPermissionRequest>
                    for CheckPermissionSvc<T> {
                        type Response = super::CheckPermissionResponse;
                        type Future = BoxFuture<
                            tonic::Response<Self::Response>,
                            tonic::Status,
                        >;
                        fn call(
                            &mut self,
                            request: tonic::Request<super::CheckPermissionRequest>,
                        ) -> Self::Future {
                            let inner = Arc::clone(&self.0);
                            let fut = async move {
                                <T as PermissionsService>::check_permission(&inner, request)
                                    .await
                            };
                            Box::pin(fut)
                        }
                    }
                    let accept_compression_encodings = self.accept_compression_encodings;
                    let send_compression_encodings = self.send_compression_encodings;
                    let max_decoding_message_size = self.max_decoding_message_size;
                    let max_encoding_message_size = self.max_encoding_message_size;
                    let inner = self.inner.clone();
                    let fut = async move {
                        let method = CheckPermissionSvc(inner);
                        let codec = tonic_prost::ProstCodec::default();
                        let mut grpc = tonic::server::Grpc::new(codec)
                            .apply_compression_config(
                                accept_compression_encodings,
                                send_compression_encodings,
                            )
                            .apply_max_message_size_config(
                                max_decoding_message_size,
                                max_encoding_message_size,
                            );
                        let res = grpc.unary(method, req).await;
                        Ok(res)
                    };
                    Box::pin(fut)
                }
                "/authzed.api.v1.PermissionsService/CheckBulkPermissions" => {
                    #[allow(non_camel_case_types)]
                    struct CheckBulkPermissionsSvc<T: PermissionsService>(pub Arc<T>);
                    impl<
                        T: PermissionsService,
                    > tonic::server::UnaryService<super::CheckBulkPermissionsRequest>
                    for CheckBulkPermissionsSvc<T> {
                        type Response = super::CheckBulkPermissionsResponse;
                        type Future = BoxFuture<
                            tonic::Response<Self::Response>,
                            tonic::Status,
                        >;
                        fn call(
                            &mut self,
                            request: tonic::Request<super::CheckBulkPermissionsRequest>,
                        ) -> Self::Future {
                            let inner = Arc::clone(&self.0);
                            let fut = async move {
                                <T as PermissionsService>::check_bulk_permissions(
                                        &inner,
                                        request,
                                    )
                                    .await
                            };
                            Box::pin(fut)
                        }
                    }
                    let accept_compression_encodings = self.accept_compression_encodings;
                    let send_compression_encodings = self.send_compression_encodings;
                    let max_decoding_message_size = self.max_decoding_message_size;
                    let max_encoding_message_size = self.max_encoding_message_size;
                    let inner = self.inner.clone();
                    let fut = async move {
                        let method = CheckBulkPermissionsSvc(inner);
                        let codec = tonic_prost::ProstCodec::default();
                        let mut grpc = tonic::server::Grpc::new(codec)
                            .apply_compression_config(
                                accept_compression_encodings,
                                send_compression_encodings,
                            )
                            .apply_max_message_size_config(
                                max_decoding_message_size,
                                max_encoding_message_size,
                            );
                        let res = grpc.unary(method, req).await;
                        Ok(res)
                    };
                    Box::pin(fut)
                }
                "/authzed.api.v1.PermissionsService/ExpandPermissionTree" => {
                    #[allow(non_camel_case_types)]
                    struct ExpandPermissionTreeSvc<T: PermissionsService>(pub Arc<T>);
                    impl<
                        T: PermissionsService,
                    > tonic::server::UnaryService<super::ExpandPermissionTreeRequest>
                    for ExpandPermissionTreeSvc<T> {
                        type Response = super::ExpandPermissionTreeResponse;
                        type Future = BoxFuture<
                            tonic::Response<Self::Response>,
                            tonic::Status,
                        >;
                        fn call(
                            &mut self,
                            request: tonic::Request<super::ExpandPermissionTreeRequest>,
                        ) -> Self::Future {
                            let inner = Arc::clone(&self.0);
                            let fut = async move {
                                <T as PermissionsService>::expand_permission_tree(
                                        &inner,
                                        request,
                                    )
                                    .await
                            };
                            Box::pin(fut)
                        }
                    }
                    let accept_compression_encodings = self.accept_compression_encodings;
                    let send_compression_encodings = self.send_compression_encodings;
                    let max_decoding_message_size = self.max_decoding_message_size;
                    let max_encoding_message_size = self.max_encoding_message_size;
                    let inner = self.inner.clone();
                    let fut = async move {
                        let method = ExpandPermissionTreeSvc(inner);
                        let codec = tonic_prost::ProstCodec::default();
                        let mut grpc = tonic::server::Grpc::new(codec)
                            .apply_compression_config(
                                accept_compression_encodings,
                                send_compression_encodings,
                            )
                            .apply_max_message_size_config(
                                max_decoding_message_size,
                                max_encoding_message_size,
                            );
                        let res = grpc.unary(method, req).await;
                        Ok(res)
                    };
                    Box::pin(fut)
                }
                "/authzed.api.v1.PermissionsService/LookupResources" => {
                    #[allow(non_camel_case_types)]
                    struct LookupResourcesSvc<T: PermissionsService>(pub Arc<T>);
                    impl<
                        T: PermissionsService,
                    > tonic::server::ServerStreamingService<
                        super::LookupResourcesRequest,
                    > for LookupResourcesSvc<T> {
                        type Response = super::LookupResourcesResponse;
                        type ResponseStream = T::LookupResourcesStream;
                        type Future = BoxFuture<
                            tonic::Response<Self::ResponseStream>,
                            tonic::Status,
                        >;
                        fn call(
                            &mut self,
                            request: tonic::Request<super::LookupResourcesRequest>,
                        ) -> Self::Future {
                            let inner = Arc::clone(&self.0);
                            let fut = async move {
                                <T as PermissionsService>::lookup_resources(&inner, request)
                                    .await
                            };
                            Box::pin(fut)
                        }
                    }
                    let accept_compression_encodings = self.accept_compression_encodings;
                    let send_compression_encodings = self.send_compression_encodings;
                    let max_decoding_message_size = self.max_decoding_message_size;
                    let max_encoding_message_size = self.max_encoding_message_size;
                    let inner = self.inner.clone();
                    let fut = async move {
                        let method = LookupResourcesSvc(inner);
                        let codec = tonic_prost::ProstCodec::default();
                        let mut grpc = tonic::server::Grpc::new(codec)
                            .apply_compression_config(
                                accept_compression_encodings,
                                send_compression_encodings,
                            )
                            .apply_max_message_size_config(
                                max_decoding_message_size,
                                max_encoding_message_size,
                            );
                        let res = grpc.server_streaming(method, req).await;
                        Ok(res)
                    };
                    Box::pin(fut)
                }
                "/authzed.api.v1.PermissionsService/LookupSubjects" => {
                    #[allow(non_camel_case_types)]
                    struct LookupSubjectsSvc<T: PermissionsService>(pub Arc<T>);
                    impl<
                        T: PermissionsService,
                    > tonic::server::ServerStreamingService<super::LookupSubjectsRequest>
                    for LookupSubjectsSvc<T> {
                        type Response = super::LookupSubjectsResponse;
                        type ResponseStream = T::LookupSubjectsStream;
                        type Future = BoxFuture<
                            tonic::Response<Self::ResponseStream>,
                            tonic::Status,
                        >;
                        fn call(
                            &mut self,
                            request: tonic::Request<super::LookupSubjectsRequest>,
                        ) -> Self::Future {
                            let inner = Arc::clone(&self.0);
                            let fut = async move {
                                <T as PermissionsService>::lookup_subjects(&inner, request)
                                    .await
                            };
                            Box::pin(fut)
                        }
                    }
                    let accept_compression_encodings = self.accept_compression_encodings;
                    let send_compression_encodings = self.send_compression_encodings;
                    let max_decoding_message_size = self.max_decoding_message_size;
                    let max_encoding_message_size = self.max_encoding_message_size;
                    let inner = self.inner.clone();
                    let fut = async move {
                        let method = LookupSubjectsSvc(inner);
                        let codec = tonic_prost::ProstCodec::default();
                        let mut grpc = tonic::server::Grpc::new(codec)
                            .apply_compression_config(
                                accept_compression_encodings,
                                send_compression_encodings,
                            )
                            .apply_max_message_size_config(
                                max_decoding_message_size,
                                max_encoding_message_size,
                            );
                        let res = grpc.server_streaming(method, req).await;
                        Ok(res)
                    };
                    Box::pin(fut)
                }
                "/authzed.api.v1.PermissionsService/ImportBulkRelationships" => {
                    #[allow(non_camel_case_types)]
                    struct ImportBulkRelationshipsSvc<T: PermissionsService>(pub Arc<T>);
                    impl<
                        T: PermissionsService,
                    > tonic::server::ClientStreamingService<
                        super::ImportBulkRelationshipsRequest,
                    > for ImportBulkRelationshipsSvc<T> {
                        type Response = super::ImportBulkRelationshipsResponse;
                        type Future = BoxFuture<
                            tonic::Response<Self::Response>,
                            tonic::Status,
                        >;
                        fn call(
                            &mut self,
                            request: tonic::Request<
                                tonic::Streaming<super::ImportBulkRelationshipsRequest>,
                            >,
                        ) -> Self::Future {
                            let inner = Arc::clone(&self.0);
                            let fut = async move {
                                <T as PermissionsService>::import_bulk_relationships(
                                        &inner,
                                        request,
                                    )
                                    .await
                            };
                            Box::pin(fut)
                        }
                    }
                    let accept_compression_encodings = self.accept_compression_encodings;
                    let send_compression_encodings = self.send_compression_encodings;
                    let max_decoding_message_size = self.max_decoding_message_size;
                    let max_encoding_message_size = self.max_encoding_message_size;
                    let inner = self.inner.clone();
                    let fut = async move {
                        let method = ImportBulkRelationshipsSvc(inner);
                        let codec = tonic_prost::ProstCodec::default();
                        let mut grpc = tonic::server::Grpc::new(codec)
                            .apply_compression_config(
                                accept_compression_encodings,
                                send_compression_encodings,
                            )
                            .apply_max_message_size_config(
                                max_decoding_message_size,
                                max_encoding_message_size,
                            );
                        let res = grpc.client_streaming(method, req).await;
                        Ok(res)
                    };
                    Box::pin(fut)
                }
                "/authzed.api.v1.PermissionsService/ExportBulkRelationships" => {
                    #[allow(non_camel_case_types)]
                    struct ExportBulkRelationshipsSvc<T: PermissionsService>(pub Arc<T>);
                    impl<
                        T: PermissionsService,
                    > tonic::server::ServerStreamingService<
                        super::ExportBulkRelationshipsRequest,
                    > for ExportBulkRelationshipsSvc<T> {
                        type Response = super::ExportBulkRelationshipsResponse;
                        type ResponseStream = T::ExportBulkRelationshipsStream;
                        type Future = BoxFuture<
                            tonic::Response<Self::ResponseStream>,
                            tonic::Status,
                        >;
                        fn call(
                            &mut self,
                            request: tonic::Request<
                                super::ExportBulkRelationshipsRequest,
                            >,
                        ) -> Self::Future {
                            let inner = Arc::clone(&self.0);
                            let fut = async move {
                                <T as PermissionsService>::export_bulk_relationships(
                                        &inner,
                                        request,
                                    )
                                    .await
                            };
                            Box::pin(fut)
                        }
                    }
                    let accept_compression_encodings = self.accept_compression_encodings;
                    let send_compression_encodings = self.send_compression_encodings;
                    let max_decoding_message_size = self.max_decoding_message_size;
                    let max_encoding_message_size = self.max_encoding_message_size;
                    let inner = self.inner.clone();
                    let fut = async move {
                        let method = ExportBulkRelationshipsSvc(inner);
                        let codec = tonic_prost::ProstCodec::default();
                        let mut grpc = tonic::server::Grpc::new(codec)
                            .apply_compression_config(
                                accept_compression_encodings,
                                send_compression_encodings,
                            )
                            .apply_max_message_size_config(
                                max_decoding_message_size,
                                max_encoding_message_size,
                            );
                        let res = grpc.server_streaming(method, req).await;
                        Ok(res)
                    };
                    Box::pin(fut)
                }
                _ => {
                    Box::pin(async move {
                        let mut response = http::Response::new(
                            tonic::body::Body::default(),
                        );
                        let headers = response.headers_mut();
                        headers
                            .insert(
                                tonic::Status::GRPC_STATUS,
                                (tonic::Code::Unimplemented as i32).into(),
                            );
                        headers
                            .insert(
                                http::header::CONTENT_TYPE,
                                tonic::metadata::GRPC_CONTENT_TYPE,
                            );
                        Ok(response)
                    })
                }
            }
        }
    }
    impl<T> Clone for PermissionsServiceServer<T> {
        fn clone(&self) -> Self {
            let inner = self.inner.clone();
            Self {
                inner,
                accept_compression_encodings: self.accept_compression_encodings,
                send_compression_encodings: self.send_compression_encodings,
                max_decoding_message_size: self.max_decoding_message_size,
                max_encoding_message_size: self.max_encoding_message_size,
            }
        }
    }
    /// Generated gRPC service name
    pub const SERVICE_NAME: &str = "authzed.api.v1.PermissionsService";
    impl<T> tonic::server::NamedService for PermissionsServiceServer<T> {
        const NAME: &'static str = SERVICE_NAME;
    }
}
/// Generated client implementations.
pub mod experimental_service_client {
    #![allow(
        unused_variables,
        dead_code,
        missing_docs,
        clippy::wildcard_imports,
        clippy::let_unit_value,
    )]
    use tonic::codegen::*;
    use tonic::codegen::http::Uri;
    #[derive(Debug, Clone)]
    pub struct ExperimentalServiceClient<T> {
        inner: tonic::client::Grpc<T>,
    }
    impl ExperimentalServiceClient<tonic::transport::Channel> {
        /// Attempt to create a new client by connecting to a given endpoint.
        pub async fn connect<D>(dst: D) -> Result<Self, tonic::transport::Error>
        where
            D: TryInto<tonic::transport::Endpoint>,
            D::Error: Into<StdError>,
        {
            let conn = tonic::transport::Endpoint::new(dst)?.connect().await?;
            Ok(Self::new(conn))
        }
    }
    impl<T> ExperimentalServiceClient<T>
    where
        T: tonic::client::GrpcService<tonic::body::Body>,
        T::Error: Into<StdError>,
        T::ResponseBody: Body<Data = Bytes> + std::marker::Send + 'static,
        <T::ResponseBody as Body>::Error: Into<StdError> + std::marker::Send,
    {
        pub fn new(inner: T) -> Self {
            let inner = tonic::client::Grpc::new(inner);
            Self { inner }
        }
        pub fn with_origin(inner: T, origin: Uri) -> Self {
            let inner = tonic::client::Grpc::with_origin(inner, origin);
            Self { inner }
        }
        pub fn with_interceptor<F>(
            inner: T,
            interceptor: F,
        ) -> ExperimentalServiceClient<InterceptedService<T, F>>
        where
            F: tonic::service::Interceptor,
            T::ResponseBody: Default,
            T: tonic::codegen::Service<
                http::Request<tonic::body::Body>,
                Response = http::Response<
                    <T as tonic::client::GrpcService<tonic::body::Body>>::ResponseBody,
                >,
            >,
            <T as tonic::codegen::Service<
                http::Request<tonic::body::Body>,
            >>::Error: Into<StdError> + std::marker::Send + std::marker::Sync,
        {
            ExperimentalServiceClient::new(InterceptedService::new(inner, interceptor))
        }
        /// Compress requests with the given encoding.
        ///
        /// This requires the server to support it otherwise it might respond with an
        /// error.
        #[must_use]
        pub fn send_compressed(mut self, encoding: CompressionEncoding) -> Self {
            self.inner = self.inner.send_compressed(encoding);
            self
        }
        /// Enable decompressing responses.
        #[must_use]
        pub fn accept_compressed(mut self, encoding: CompressionEncoding) -> Self {
            self.inner = self.inner.accept_compressed(encoding);
            self
        }
        /// Limits the maximum size of a decoded message.
        ///
        /// Default: `4MB`
        #[must_use]
        pub fn max_decoding_message_size(mut self, limit: usize) -> Self {
            self.inner = self.inner.max_decoding_message_size(limit);
            self
        }
        /// Limits the maximum size of an encoded message.
        ///
        /// Default: `usize::MAX`
        #[must_use]
        pub fn max_encoding_message_size(mut self, limit: usize) -> Self {
            self.inner = self.inner.max_encoding_message_size(limit);
            self
        }
        pub async fn bulk_import_relationships(
            &mut self,
            request: impl tonic::IntoStreamingRequest<
                Message = super::BulkImportRelationshipsRequest,
            >,
        ) -> std::result::Result<
            tonic::Response<super::BulkImportRelationshipsResponse>,
            tonic::Status,
        > {
            self.inner
                .ready()
                .await
                .map_err(|e| {
                    tonic::Status::unknown(
                        format!("Service was not ready: {}", e.into()),
                    )
                })?;
            let codec = tonic_prost::ProstCodec::default();
            let path = http::uri::PathAndQuery::from_static(
                "/authzed.api.v1.ExperimentalService/BulkImportRelationships",
            );
            let mut req = request.into_streaming_request();
            req.extensions_mut()
                .insert(
                    GrpcMethod::new(
                        "authzed.api.v1.ExperimentalService",
                        "BulkImportRelationships",
                    ),
                );
            self.inner.client_streaming(req, path, codec).await
        }
        pub async fn bulk_export_relationships(
            &mut self,
            request: impl tonic::IntoRequest<super::BulkExportRelationshipsRequest>,
        ) -> std::result::Result<
            tonic::Response<
                tonic::codec::Streaming<super::BulkExportRelationshipsResponse>,
            >,
            tonic::Status,
        > {
            self.inner
                .ready()
                .await
                .map_err(|e| {
                    tonic::Status::unknown(
                        format!("Service was not ready: {}", e.into()),
                    )
                })?;
            let codec = tonic_prost::ProstCodec::default();
            let path = http::uri::PathAndQuery::from_static(
                "/authzed.api.v1.ExperimentalService/BulkExportRelationships",
            );
            let mut req = request.into_request();
            req.extensions_mut()
                .insert(
                    GrpcMethod::new(
                        "authzed.api.v1.ExperimentalService",
                        "BulkExportRelationships",
                    ),
                );
            self.inner.server_streaming(req, path, codec).await
        }
        pub async fn bulk_check_permission(
            &mut self,
            request: impl tonic::IntoRequest<super::BulkCheckPermissionRequest>,
        ) -> std::result::Result<
            tonic::Response<super::BulkCheckPermissionResponse>,
            tonic::Status,
        > {
            self.inner
                .ready()
                .await
                .map_err(|e| {
                    tonic::Status::unknown(
                        format!("Service was not ready: {}", e.into()),
                    )
                })?;
            let codec = tonic_prost::ProstCodec::default();
            let path = http::uri::PathAndQuery::from_static(
                "/authzed.api.v1.ExperimentalService/BulkCheckPermission",
            );
            let mut req = request.into_request();
            req.extensions_mut()
                .insert(
                    GrpcMethod::new(
                        "authzed.api.v1.ExperimentalService",
                        "BulkCheckPermission",
                    ),
                );
            self.inner.unary(req, path, codec).await
        }
        pub async fn experimental_reflect_schema(
            &mut self,
            request: impl tonic::IntoRequest<super::ExperimentalReflectSchemaRequest>,
        ) -> std::result::Result<
            tonic::Response<super::ExperimentalReflectSchemaResponse>,
            tonic::Status,
        > {
            self.inner
                .ready()
                .await
                .map_err(|e| {
                    tonic::Status::unknown(
                        format!("Service was not ready: {}", e.into()),
                    )
                })?;
            let codec = tonic_prost::ProstCodec::default();
            let path = http::uri::PathAndQuery::from_static(
                "/authzed.api.v1.ExperimentalService/ExperimentalReflectSchema",
            );
            let mut req = request.into_request();
            req.extensions_mut()
                .insert(
                    GrpcMethod::new(
                        "authzed.api.v1.ExperimentalService",
                        "ExperimentalReflectSchema",
                    ),
                );
            self.inner.unary(req, path, codec).await
        }
        pub async fn experimental_computable_permissions(
            &mut self,
            request: impl tonic::IntoRequest<
                super::ExperimentalComputablePermissionsRequest,
            >,
        ) -> std::result::Result<
            tonic::Response<super::ExperimentalComputablePermissionsResponse>,
            tonic::Status,
        > {
            self.inner
                .ready()
                .await
                .map_err(|e| {
                    tonic::Status::unknown(
                        format!("Service was not ready: {}", e.into()),
                    )
                })?;
            let codec = tonic_prost::ProstCodec::default();
            let path = http::uri::PathAndQuery::from_static(
                "/authzed.api.v1.ExperimentalService/ExperimentalComputablePermissions",
            );
            let mut req = request.into_request();
            req.extensions_mut()
                .insert(
                    GrpcMethod::new(
                        "authzed.api.v1.ExperimentalService",
                        "ExperimentalComputablePermissions",
                    ),
                );
            self.inner.unary(req, path, codec).await
        }
        pub async fn experimental_dependent_relations(
            &mut self,
            request: impl tonic::IntoRequest<
                super::ExperimentalDependentRelationsRequest,
            >,
        ) -> std::result::Result<
            tonic::Response<super::ExperimentalDependentRelationsResponse>,
            tonic::Status,
        > {
            self.inner
                .ready()
                .await
                .map_err(|e| {
                    tonic::Status::unknown(
                        format!("Service was not ready: {}", e.into()),
                    )
                })?;
            let codec = tonic_prost::ProstCodec::default();
            let path = http::uri::PathAndQuery::from_static(
                "/authzed.api.v1.ExperimentalService/ExperimentalDependentRelations",
            );
            let mut req = request.into_request();
            req.extensions_mut()
                .insert(
                    GrpcMethod::new(
                        "authzed.api.v1.ExperimentalService",
                        "ExperimentalDependentRelations",
                    ),
                );
            self.inner.unary(req, path, codec).await
        }
        pub async fn experimental_diff_schema(
            &mut self,
            request: impl tonic::IntoRequest<super::ExperimentalDiffSchemaRequest>,
        ) -> std::result::Result<
            tonic::Response<super::ExperimentalDiffSchemaResponse>,
            tonic::Status,
        > {
            self.inner
                .ready()
                .await
                .map_err(|e| {
                    tonic::Status::unknown(
                        format!("Service was not ready: {}", e.into()),
                    )
                })?;
            let codec = tonic_prost::ProstCodec::default();
            let path = http::uri::PathAndQuery::from_static(
                "/authzed.api.v1.ExperimentalService/ExperimentalDiffSchema",
            );
            let mut req = request.into_request();
            req.extensions_mut()
                .insert(
                    GrpcMethod::new(
                        "authzed.api.v1.ExperimentalService",
                        "ExperimentalDiffSchema",
                    ),
                );
            self.inner.unary(req, path, codec).await
        }
        pub async fn experimental_register_relationship_counter(
            &mut self,
            request: impl tonic::IntoRequest<
                super::ExperimentalRegisterRelationshipCounterRequest,
            >,
        ) -> std::result::Result<
            tonic::Response<super::ExperimentalRegisterRelationshipCounterResponse>,
            tonic::Status,
        > {
            self.inner
                .ready()
                .await
                .map_err(|e| {
                    tonic::Status::unknown(
                        format!("Service was not ready: {}", e.into()),
                    )
                })?;
            let codec = tonic_prost::ProstCodec::default();
            let path = http::uri::PathAndQuery::from_static(
                "/authzed.api.v1.ExperimentalService/ExperimentalRegisterRelationshipCounter",
            );
            let mut req = request.into_request();
            req.extensions_mut()
                .insert(
                    GrpcMethod::new(
                        "authzed.api.v1.ExperimentalService",
                        "ExperimentalRegisterRelationshipCounter",
                    ),
                );
            self.inner.unary(req, path, codec).await
        }
        pub async fn experimental_count_relationships(
            &mut self,
            request: impl tonic::IntoRequest<
                super::ExperimentalCountRelationshipsRequest,
            >,
        ) -> std::result::Result<
            tonic::Response<super::ExperimentalCountRelationshipsResponse>,
            tonic::Status,
        > {
            self.inner
                .ready()
                .await
                .map_err(|e| {
                    tonic::Status::unknown(
                        format!("Service was not ready: {}", e.into()),
                    )
                })?;
            let codec = tonic_prost::ProstCodec::default();
            let path = http::uri::PathAndQuery::from_static(
                "/authzed.api.v1.ExperimentalService/ExperimentalCountRelationships",
            );
            let mut req = request.into_request();
            req.extensions_mut()
                .insert(
                    GrpcMethod::new(
                        "authzed.api.v1.ExperimentalService",
                        "ExperimentalCountRelationships",
                    ),
                );
            self.inner.unary(req, path, codec).await
        }
        pub async fn experimental_unregister_relationship_counter(
            &mut self,
            request: impl tonic::IntoRequest<
                super::ExperimentalUnregisterRelationshipCounterRequest,
            >,
        ) -> std::result::Result<
            tonic::Response<super::ExperimentalUnregisterRelationshipCounterResponse>,
            tonic::Status,
        > {
            self.inner
                .ready()
                .await
                .map_err(|e| {
                    tonic::Status::unknown(
                        format!("Service was not ready: {}", e.into()),
                    )
                })?;
            let codec = tonic_prost::ProstCodec::default();
            let path = http::uri::PathAndQuery::from_static(
                "/authzed.api.v1.ExperimentalService/ExperimentalUnregisterRelationshipCounter",
            );
            let mut req = request.into_request();
            req.extensions_mut()
                .insert(
                    GrpcMethod::new(
                        "authzed.api.v1.ExperimentalService",
                        "ExperimentalUnregisterRelationshipCounter",
                    ),
                );
            self.inner.unary(req, path, codec).await
        }
    }
}
/// Generated server implementations.
pub mod experimental_service_server {
    #![allow(
        unused_variables,
        dead_code,
        missing_docs,
        clippy::wildcard_imports,
        clippy::let_unit_value,
    )]
    use tonic::codegen::*;
    /// Generated trait containing gRPC methods that should be implemented for use with ExperimentalServiceServer.
    #[async_trait]
    pub trait ExperimentalService: std::marker::Send + std::marker::Sync + 'static {
        async fn bulk_import_relationships(
            &self,
            request: tonic::Request<
                tonic::Streaming<super::BulkImportRelationshipsRequest>,
            >,
        ) -> std::result::Result<
            tonic::Response<super::BulkImportRelationshipsResponse>,
            tonic::Status,
        >;
        /// Server streaming response type for the BulkExportRelationships method.
        type BulkExportRelationshipsStream: tonic::codegen::tokio_stream::Stream<
                Item = std::result::Result<
                    super::BulkExportRelationshipsResponse,
                    tonic::Status,
                >,
            >
            + std::marker::Send
            + 'static;
        async fn bulk_export_relationships(
            &self,
            request: tonic::Request<super::BulkExportRelationshipsRequest>,
        ) -> std::result::Result<
            tonic::Response<Self::BulkExportRelationshipsStream>,
            tonic::Status,
        >;
        async fn bulk_check_permission(
            &self,
            request: tonic::Request<super::BulkCheckPermissionRequest>,
        ) -> std::result::Result<
            tonic::Response<super::BulkCheckPermissionResponse>,
            tonic::Status,
        >;
        async fn experimental_reflect_schema(
            &self,
            request: tonic::Request<super::ExperimentalReflectSchemaRequest>,
        ) -> std::result::Result<
            tonic::Response<super::ExperimentalReflectSchemaResponse>,
            tonic::Status,
        >;
        async fn experimental_computable_permissions(
            &self,
            request: tonic::Request<super::ExperimentalComputablePermissionsRequest>,
        ) -> std::result::Result<
            tonic::Response<super::ExperimentalComputablePermissionsResponse>,
            tonic::Status,
        >;
        async fn experimental_dependent_relations(
            &self,
            request: tonic::Request<super::ExperimentalDependentRelationsRequest>,
        ) -> std::result::Result<
            tonic::Response<super::ExperimentalDependentRelationsResponse>,
            tonic::Status,
        >;
        async fn experimental_diff_schema(
            &self,
            request: tonic::Request<super::ExperimentalDiffSchemaRequest>,
        ) -> std::result::Result<
            tonic::Response<super::ExperimentalDiffSchemaResponse>,
            tonic::Status,
        >;
        async fn experimental_register_relationship_counter(
            &self,
            request: tonic::Request<
                super::ExperimentalRegisterRelationshipCounterRequest,
            >,
        ) -> std::result::Result<
            tonic::Response<super::ExperimentalRegisterRelationshipCounterResponse>,
            tonic::Status,
        >;
        async fn experimental_count_relationships(
            &self,
            request: tonic::Request<super::ExperimentalCountRelationshipsRequest>,
        ) -> std::result::Result<
            tonic::Response<super::ExperimentalCountRelationshipsResponse>,
            tonic::Status,
        >;
        async fn experimental_unregister_relationship_counter(
            &self,
            request: tonic::Request<
                super::ExperimentalUnregisterRelationshipCounterRequest,
            >,
        ) -> std::result::Result<
            tonic::Response<super::ExperimentalUnregisterRelationshipCounterResponse>,
            tonic::Status,
        >;
    }
    #[derive(Debug)]
    pub struct ExperimentalServiceServer<T> {
        inner: Arc<T>,
        accept_compression_encodings: EnabledCompressionEncodings,
        send_compression_encodings: EnabledCompressionEncodings,
        max_decoding_message_size: Option<usize>,
        max_encoding_message_size: Option<usize>,
    }
    impl<T> ExperimentalServiceServer<T> {
        pub fn new(inner: T) -> Self {
            Self::from_arc(Arc::new(inner))
        }
        pub fn from_arc(inner: Arc<T>) -> Self {
            Self {
                inner,
                accept_compression_encodings: Default::default(),
                send_compression_encodings: Default::default(),
                max_decoding_message_size: None,
                max_encoding_message_size: None,
            }
        }
        pub fn with_interceptor<F>(
            inner: T,
            interceptor: F,
        ) -> InterceptedService<Self, F>
        where
            F: tonic::service::Interceptor,
        {
            InterceptedService::new(Self::new(inner), interceptor)
        }
        /// Enable decompressing requests with the given encoding.
        #[must_use]
        pub fn accept_compressed(mut self, encoding: CompressionEncoding) -> Self {
            self.accept_compression_encodings.enable(encoding);
            self
        }
        /// Compress responses with the given encoding, if the client supports it.
        #[must_use]
        pub fn send_compressed(mut self, encoding: CompressionEncoding) -> Self {
            self.send_compression_encodings.enable(encoding);
            self
        }
        /// Limits the maximum size of a decoded message.
        ///
        /// Default: `4MB`
        #[must_use]
        pub fn max_decoding_message_size(mut self, limit: usize) -> Self {
            self.max_decoding_message_size = Some(limit);
            self
        }
        /// Limits the maximum size of an encoded message.
        ///
        /// Default: `usize::MAX`
        #[must_use]
        pub fn max_encoding_message_size(mut self, limit: usize) -> Self {
            self.max_encoding_message_size = Some(limit);
            self
        }
    }
    impl<T, B> tonic::codegen::Service<http::Request<B>> for ExperimentalServiceServer<T>
    where
        T: ExperimentalService,
        B: Body + std::marker::Send + 'static,
        B::Error: Into<StdError> + std::marker::Send + 'static,
    {
        type Response = http::Response<tonic::body::Body>;
        type Error = std::convert::Infallible;
        type Future = BoxFuture<Self::Response, Self::Error>;
        fn poll_ready(
            &mut self,
            _cx: &mut Context<'_>,
        ) -> Poll<std::result::Result<(), Self::Error>> {
            Poll::Ready(Ok(()))
        }
        fn call(&mut self, req: http::Request<B>) -> Self::Future {
            match req.uri().path() {
                "/authzed.api.v1.ExperimentalService/BulkImportRelationships" => {
                    #[allow(non_camel_case_types)]
                    struct BulkImportRelationshipsSvc<T: ExperimentalService>(
                        pub Arc<T>,
                    );
                    impl<
                        T: ExperimentalService,
                    > tonic::server::ClientStreamingService<
                        super::BulkImportRelationshipsRequest,
                    > for BulkImportRelationshipsSvc<T> {
                        type Response = super::BulkImportRelationshipsResponse;
                        type Future = BoxFuture<
                            tonic::Response<Self::Response>,
                            tonic::Status,
                        >;
                        fn call(
                            &mut self,
                            request: tonic::Request<
                                tonic::Streaming<super::BulkImportRelationshipsRequest>,
                            >,
                        ) -> Self::Future {
                            let inner = Arc::clone(&self.0);
                            let fut = async move {
                                <T as ExperimentalService>::bulk_import_relationships(
                                        &inner,
                                        request,
                                    )
                                    .await
                            };
                            Box::pin(fut)
                        }
                    }
                    let accept_compression_encodings = self.accept_compression_encodings;
                    let send_compression_encodings = self.send_compression_encodings;
                    let max_decoding_message_size = self.max_decoding_message_size;
                    let max_encoding_message_size = self.max_encoding_message_size;
                    let inner = self.inner.clone();
                    let fut = async move {
                        let method = BulkImportRelationshipsSvc(inner);
                        let codec = tonic_prost::ProstCodec::default();
                        let mut grpc = tonic::server::Grpc::new(codec)
                            .apply_compression_config(
                                accept_compression_encodings,
                                send_compression_encodings,
                            )
                            .apply_max_message_size_config(
                                max_decoding_message_size,
                                max_encoding_message_size,
                            );
                        let res = grpc.client_streaming(method, req).await;
                        Ok(res)
                    };
                    Box::pin(fut)
                }
                "/authzed.api.v1.ExperimentalService/BulkExportRelationships" => {
                    #[allow(non_camel_case_types)]
                    struct BulkExportRelationshipsSvc<T: ExperimentalService>(
                        pub Arc<T>,
                    );
                    impl<
                        T: ExperimentalService,
                    > tonic::server::ServerStreamingService<
                        super::BulkExportRelationshipsRequest,
                    > for BulkExportRelationshipsSvc<T> {
                        type Response = super::BulkExportRelationshipsResponse;
                        type ResponseStream = T::BulkExportRelationshipsStream;
                        type Future = BoxFuture<
                            tonic::Response<Self::ResponseStream>,
                            tonic::Status,
                        >;
                        fn call(
                            &mut self,
                            request: tonic::Request<
                                super::BulkExportRelationshipsRequest,
                            >,
                        ) -> Self::Future {
                            let inner = Arc::clone(&self.0);
                            let fut = async move {
                                <T as ExperimentalService>::bulk_export_relationships(
                                        &inner,
                                        request,
                                    )
                                    .await
                            };
                            Box::pin(fut)
                        }
                    }
                    let accept_compression_encodings = self.accept_compression_encodings;
                    let send_compression_encodings = self.send_compression_encodings;
                    let max_decoding_message_size = self.max_decoding_message_size;
                    let max_encoding_message_size = self.max_encoding_message_size;
                    let inner = self.inner.clone();
                    let fut = async move {
                        let method = BulkExportRelationshipsSvc(inner);
                        let codec = tonic_prost::ProstCodec::default();
                        let mut grpc = tonic::server::Grpc::new(codec)
                            .apply_compression_config(
                                accept_compression_encodings,
                                send_compression_encodings,
                            )
                            .apply_max_message_size_config(
                                max_decoding_message_size,
                                max_encoding_message_size,
                            );
                        let res = grpc.server_streaming(method, req).await;
                        Ok(res)
                    };
                    Box::pin(fut)
                }
                "/authzed.api.v1.ExperimentalService/BulkCheckPermission" => {
                    #[allow(non_camel_case_types)]
                    struct BulkCheckPermissionSvc<T: ExperimentalService>(pub Arc<T>);
                    impl<
                        T: ExperimentalService,
                    > tonic::server::UnaryService<super::BulkCheckPermissionRequest>
                    for BulkCheckPermissionSvc<T> {
                        type Response = super::BulkCheckPermissionResponse;
                        type Future = BoxFuture<
                            tonic::Response<Self::Response>,
                            tonic::Status,
                        >;
                        fn call(
                            &mut self,
                            request: tonic::Request<super::BulkCheckPermissionRequest>,
                        ) -> Self::Future {
                            let inner = Arc::clone(&self.0);
                            let fut = async move {
                                <T as ExperimentalService>::bulk_check_permission(
                                        &inner,
                                        request,
                                    )
                                    .await
                            };
                            Box::pin(fut)
                        }
                    }
                    let accept_compression_encodings = self.accept_compression_encodings;
                    let send_compression_encodings = self.send_compression_encodings;
                    let max_decoding_message_size = self.max_decoding_message_size;
                    let max_encoding_message_size = self.max_encoding_message_size;
                    let inner = self.inner.clone();
                    let fut = async move {
                        let method = BulkCheckPermissionSvc(inner);
                        let codec = tonic_prost::ProstCodec::default();
                        let mut grpc = tonic::server::Grpc::new(codec)
                            .apply_compression_config(
                                accept_compression_encodings,
                                send_compression_encodings,
                            )
                            .apply_max_message_size_config(
                                max_decoding_message_size,
                                max_encoding_message_size,
                            );
                        let res = grpc.unary(method, req).await;
                        Ok(res)
                    };
                    Box::pin(fut)
                }
                "/authzed.api.v1.ExperimentalService/ExperimentalReflectSchema" => {
                    #[allow(non_camel_case_types)]
                    struct ExperimentalReflectSchemaSvc<T: ExperimentalService>(
                        pub Arc<T>,
                    );
                    impl<
                        T: ExperimentalService,
                    > tonic::server::UnaryService<
                        super::ExperimentalReflectSchemaRequest,
                    > for ExperimentalReflectSchemaSvc<T> {
                        type Response = super::ExperimentalReflectSchemaResponse;
                        type Future = BoxFuture<
                            tonic::Response<Self::Response>,
                            tonic::Status,
                        >;
                        fn call(
                            &mut self,
                            request: tonic::Request<
                                super::ExperimentalReflectSchemaRequest,
                            >,
                        ) -> Self::Future {
                            let inner = Arc::clone(&self.0);
                            let fut = async move {
                                <T as ExperimentalService>::experimental_reflect_schema(
                                        &inner,
                                        request,
                                    )
                                    .await
                            };
                            Box::pin(fut)
                        }
                    }
                    let accept_compression_encodings = self.accept_compression_encodings;
                    let send_compression_encodings = self.send_compression_encodings;
                    let max_decoding_message_size = self.max_decoding_message_size;
                    let max_encoding_message_size = self.max_encoding_message_size;
                    let inner = self.inner.clone();
                    let fut = async move {
                        let method = ExperimentalReflectSchemaSvc(inner);
                        let codec = tonic_prost::ProstCodec::default();
                        let mut grpc = tonic::server::Grpc::new(codec)
                            .apply_compression_config(
                                accept_compression_encodings,
                                send_compression_encodings,
                            )
                            .apply_max_message_size_config(
                                max_decoding_message_size,
                                max_encoding_message_size,
                            );
                        let res = grpc.unary(method, req).await;
                        Ok(res)
                    };
                    Box::pin(fut)
                }
                "/authzed.api.v1.ExperimentalService/ExperimentalComputablePermissions" => {
                    #[allow(non_camel_case_types)]
                    struct ExperimentalComputablePermissionsSvc<T: ExperimentalService>(
                        pub Arc<T>,
                    );
                    impl<
                        T: ExperimentalService,
                    > tonic::server::UnaryService<
                        super::ExperimentalComputablePermissionsRequest,
                    > for ExperimentalComputablePermissionsSvc<T> {
                        type Response = super::ExperimentalComputablePermissionsResponse;
                        type Future = BoxFuture<
                            tonic::Response<Self::Response>,
                            tonic::Status,
                        >;
                        fn call(
                            &mut self,
                            request: tonic::Request<
                                super::ExperimentalComputablePermissionsRequest,
                            >,
                        ) -> Self::Future {
                            let inner = Arc::clone(&self.0);
                            let fut = async move {
                                <T as ExperimentalService>::experimental_computable_permissions(
                                        &inner,
                                        request,
                                    )
                                    .await
                            };
                            Box::pin(fut)
                        }
                    }
                    let accept_compression_encodings = self.accept_compression_encodings;
                    let send_compression_encodings = self.send_compression_encodings;
                    let max_decoding_message_size = self.max_decoding_message_size;
                    let max_encoding_message_size = self.max_encoding_message_size;
                    let inner = self.inner.clone();
                    let fut = async move {
                        let method = ExperimentalComputablePermissionsSvc(inner);
                        let codec = tonic_prost::ProstCodec::default();
                        let mut grpc = tonic::server::Grpc::new(codec)
                            .apply_compression_config(
                                accept_compression_encodings,
                                send_compression_encodings,
                            )
                            .apply_max_message_size_config(
                                max_decoding_message_size,
                                max_encoding_message_size,
                            );
                        let res = grpc.unary(method, req).await;
                        Ok(res)
                    };
                    Box::pin(fut)
                }
                "/authzed.api.v1.ExperimentalService/ExperimentalDependentRelations" => {
                    #[allow(non_camel_case_types)]
                    struct ExperimentalDependentRelationsSvc<T: ExperimentalService>(
                        pub Arc<T>,
                    );
                    impl<
                        T: ExperimentalService,
                    > tonic::server::UnaryService<
                        super::ExperimentalDependentRelationsRequest,
                    > for ExperimentalDependentRelationsSvc<T> {
                        type Response = super::ExperimentalDependentRelationsResponse;
                        type Future = BoxFuture<
                            tonic::Response<Self::Response>,
                            tonic::Status,
                        >;
                        fn call(
                            &mut self,
                            request: tonic::Request<
                                super::ExperimentalDependentRelationsRequest,
                            >,
                        ) -> Self::Future {
                            let inner = Arc::clone(&self.0);
                            let fut = async move {
                                <T as ExperimentalService>::experimental_dependent_relations(
                                        &inner,
                                        request,
                                    )
                                    .await
                            };
                            Box::pin(fut)
                        }
                    }
                    let accept_compression_encodings = self.accept_compression_encodings;
                    let send_compression_encodings = self.send_compression_encodings;
                    let max_decoding_message_size = self.max_decoding_message_size;
                    let max_encoding_message_size = self.max_encoding_message_size;
                    let inner = self.inner.clone();
                    let fut = async move {
                        let method = ExperimentalDependentRelationsSvc(inner);
                        let codec = tonic_prost::ProstCodec::default();
                        let mut grpc = tonic::server::Grpc::new(codec)
                            .apply_compression_config(
                                accept_compression_encodings,
                                send_compression_encodings,
                            )
                            .apply_max_message_size_config(
                                max_decoding_message_size,
                                max_encoding_message_size,
                            );
                        let res = grpc.unary(method, req).await;
                        Ok(res)
                    };
                    Box::pin(fut)
                }
                "/authzed.api.v1.ExperimentalService/ExperimentalDiffSchema" => {
                    #[allow(non_camel_case_types)]
                    struct ExperimentalDiffSchemaSvc<T: ExperimentalService>(pub Arc<T>);
                    impl<
                        T: ExperimentalService,
                    > tonic::server::UnaryService<super::ExperimentalDiffSchemaRequest>
                    for ExperimentalDiffSchemaSvc<T> {
                        type Response = super::ExperimentalDiffSchemaResponse;
                        type Future = BoxFuture<
                            tonic::Response<Self::Response>,
                            tonic::Status,
                        >;
                        fn call(
                            &mut self,
                            request: tonic::Request<super::ExperimentalDiffSchemaRequest>,
                        ) -> Self::Future {
                            let inner = Arc::clone(&self.0);
                            let fut = async move {
                                <T as ExperimentalService>::experimental_diff_schema(
                                        &inner,
                                        request,
                                    )
                                    .await
                            };
                            Box::pin(fut)
                        }
                    }
                    let accept_compression_encodings = self.accept_compression_encodings;
                    let send_compression_encodings = self.send_compression_encodings;
                    let max_decoding_message_size = self.max_decoding_message_size;
                    let max_encoding_message_size = self.max_encoding_message_size;
                    let inner = self.inner.clone();
                    let fut = async move {
                        let method = ExperimentalDiffSchemaSvc(inner);
                        let codec = tonic_prost::ProstCodec::default();
                        let mut grpc = tonic::server::Grpc::new(codec)
                            .apply_compression_config(
                                accept_compression_encodings,
                                send_compression_encodings,
                            )
                            .apply_max_message_size_config(
                                max_decoding_message_size,
                                max_encoding_message_size,
                            );
                        let res = grpc.unary(method, req).await;
                        Ok(res)
                    };
                    Box::pin(fut)
                }
                "/authzed.api.v1.ExperimentalService/ExperimentalRegisterRelationshipCounter" => {
                    #[allow(non_camel_case_types)]
                    struct ExperimentalRegisterRelationshipCounterSvc<
                        T: ExperimentalService,
                    >(
                        pub Arc<T>,
                    );
                    impl<
                        T: ExperimentalService,
                    > tonic::server::UnaryService<
                        super::ExperimentalRegisterRelationshipCounterRequest,
                    > for ExperimentalRegisterRelationshipCounterSvc<T> {
                        type Response = super::ExperimentalRegisterRelationshipCounterResponse;
                        type Future = BoxFuture<
                            tonic::Response<Self::Response>,
                            tonic::Status,
                        >;
                        fn call(
                            &mut self,
                            request: tonic::Request<
                                super::ExperimentalRegisterRelationshipCounterRequest,
                            >,
                        ) -> Self::Future {
                            let inner = Arc::clone(&self.0);
                            let fut = async move {
                                <T as ExperimentalService>::experimental_register_relationship_counter(
                                        &inner,
                                        request,
                                    )
                                    .await
                            };
                            Box::pin(fut)
                        }
                    }
                    let accept_compression_encodings = self.accept_compression_encodings;
                    let send_compression_encodings = self.send_compression_encodings;
                    let max_decoding_message_size = self.max_decoding_message_size;
                    let max_encoding_message_size = self.max_encoding_message_size;
                    let inner = self.inner.clone();
                    let fut = async move {
                        let method = ExperimentalRegisterRelationshipCounterSvc(inner);
                        let codec = tonic_prost::ProstCodec::default();
                        let mut grpc = tonic::server::Grpc::new(codec)
                            .apply_compression_config(
                                accept_compression_encodings,
                                send_compression_encodings,
                            )
                            .apply_max_message_size_config(
                                max_decoding_message_size,
                                max_encoding_message_size,
                            );
                        let res = grpc.unary(method, req).await;
                        Ok(res)
                    };
                    Box::pin(fut)
                }
                "/authzed.api.v1.ExperimentalService/ExperimentalCountRelationships" => {
                    #[allow(non_camel_case_types)]
                    struct ExperimentalCountRelationshipsSvc<T: ExperimentalService>(
                        pub Arc<T>,
                    );
                    impl<
                        T: ExperimentalService,
                    > tonic::server::UnaryService<
                        super::ExperimentalCountRelationshipsRequest,
                    > for ExperimentalCountRelationshipsSvc<T> {
                        type Response = super::ExperimentalCountRelationshipsResponse;
                        type Future = BoxFuture<
                            tonic::Response<Self::Response>,
                            tonic::Status,
                        >;
                        fn call(
                            &mut self,
                            request: tonic::Request<
                                super::ExperimentalCountRelationshipsRequest,
                            >,
                        ) -> Self::Future {
                            let inner = Arc::clone(&self.0);
                            let fut = async move {
                                <T as ExperimentalService>::experimental_count_relationships(
                                        &inner,
                                        request,
                                    )
                                    .await
                            };
                            Box::pin(fut)
                        }
                    }
                    let accept_compression_encodings = self.accept_compression_encodings;
                    let send_compression_encodings = self.send_compression_encodings;
                    let max_decoding_message_size = self.max_decoding_message_size;
                    let max_encoding_message_size = self.max_encoding_message_size;
                    let inner = self.inner.clone();
                    let fut = async move {
                        let method = ExperimentalCountRelationshipsSvc(inner);
                        let codec = tonic_prost::ProstCodec::default();
                        let mut grpc = tonic::server::Grpc::new(codec)
                            .apply_compression_config(
                                accept_compression_encodings,
                                send_compression_encodings,
                            )
                            .apply_max_message_size_config(
                                max_decoding_message_size,
                                max_encoding_message_size,
                            );
                        let res = grpc.unary(method, req).await;
                        Ok(res)
                    };
                    Box::pin(fut)
                }
                "/authzed.api.v1.ExperimentalService/ExperimentalUnregisterRelationshipCounter" => {
                    #[allow(non_camel_case_types)]
                    struct ExperimentalUnregisterRelationshipCounterSvc<
                        T: ExperimentalService,
                    >(
                        pub Arc<T>,
                    );
                    impl<
                        T: ExperimentalService,
                    > tonic::server::UnaryService<
                        super::ExperimentalUnregisterRelationshipCounterRequest,
                    > for ExperimentalUnregisterRelationshipCounterSvc<T> {
                        type Response = super::ExperimentalUnregisterRelationshipCounterResponse;
                        type Future = BoxFuture<
                            tonic::Response<Self::Response>,
                            tonic::Status,
                        >;
                        fn call(
                            &mut self,
                            request: tonic::Request<
                                super::ExperimentalUnregisterRelationshipCounterRequest,
                            >,
                        ) -> Self::Future {
                            let inner = Arc::clone(&self.0);
                            let fut = async move {
                                <T as ExperimentalService>::experimental_unregister_relationship_counter(
                                        &inner,
                                        request,
                                    )
                                    .await
                            };
                            Box::pin(fut)
                        }
                    }
                    let accept_compression_encodings = self.accept_compression_encodings;
                    let send_compression_encodings = self.send_compression_encodings;
                    let max_decoding_message_size = self.max_decoding_message_size;
                    let max_encoding_message_size = self.max_encoding_message_size;
                    let inner = self.inner.clone();
                    let fut = async move {
                        let method = ExperimentalUnregisterRelationshipCounterSvc(inner);
                        let codec = tonic_prost::ProstCodec::default();
                        let mut grpc = tonic::server::Grpc::new(codec)
                            .apply_compression_config(
                                accept_compression_encodings,
                                send_compression_encodings,
                            )
                            .apply_max_message_size_config(
                                max_decoding_message_size,
                                max_encoding_message_size,
                            );
                        let res = grpc.unary(method, req).await;
                        Ok(res)
                    };
                    Box::pin(fut)
                }
                _ => {
                    Box::pin(async move {
                        let mut response = http::Response::new(
                            tonic::body::Body::default(),
                        );
                        let headers = response.headers_mut();
                        headers
                            .insert(
                                tonic::Status::GRPC_STATUS,
                                (tonic::Code::Unimplemented as i32).into(),
                            );
                        headers
                            .insert(
                                http::header::CONTENT_TYPE,
                                tonic::metadata::GRPC_CONTENT_TYPE,
                            );
                        Ok(response)
                    })
                }
            }
        }
    }
    impl<T> Clone for ExperimentalServiceServer<T> {
        fn clone(&self) -> Self {
            let inner = self.inner.clone();
            Self {
                inner,
                accept_compression_encodings: self.accept_compression_encodings,
                send_compression_encodings: self.send_compression_encodings,
                max_decoding_message_size: self.max_decoding_message_size,
                max_encoding_message_size: self.max_encoding_message_size,
            }
        }
    }
    /// Generated gRPC service name
    pub const SERVICE_NAME: &str = "authzed.api.v1.ExperimentalService";
    impl<T> tonic::server::NamedService for ExperimentalServiceServer<T> {
        const NAME: &'static str = SERVICE_NAME;
    }
}
/// Generated client implementations.
pub mod schema_service_client {
    #![allow(
        unused_variables,
        dead_code,
        missing_docs,
        clippy::wildcard_imports,
        clippy::let_unit_value,
    )]
    use tonic::codegen::*;
    use tonic::codegen::http::Uri;
    #[derive(Debug, Clone)]
    pub struct SchemaServiceClient<T> {
        inner: tonic::client::Grpc<T>,
    }
    impl SchemaServiceClient<tonic::transport::Channel> {
        /// Attempt to create a new client by connecting to a given endpoint.
        pub async fn connect<D>(dst: D) -> Result<Self, tonic::transport::Error>
        where
            D: TryInto<tonic::transport::Endpoint>,
            D::Error: Into<StdError>,
        {
            let conn = tonic::transport::Endpoint::new(dst)?.connect().await?;
            Ok(Self::new(conn))
        }
    }
    impl<T> SchemaServiceClient<T>
    where
        T: tonic::client::GrpcService<tonic::body::Body>,
        T::Error: Into<StdError>,
        T::ResponseBody: Body<Data = Bytes> + std::marker::Send + 'static,
        <T::ResponseBody as Body>::Error: Into<StdError> + std::marker::Send,
    {
        pub fn new(inner: T) -> Self {
            let inner = tonic::client::Grpc::new(inner);
            Self { inner }
        }
        pub fn with_origin(inner: T, origin: Uri) -> Self {
            let inner = tonic::client::Grpc::with_origin(inner, origin);
            Self { inner }
        }
        pub fn with_interceptor<F>(
            inner: T,
            interceptor: F,
        ) -> SchemaServiceClient<InterceptedService<T, F>>
        where
            F: tonic::service::Interceptor,
            T::ResponseBody: Default,
            T: tonic::codegen::Service<
                http::Request<tonic::body::Body>,
                Response = http::Response<
                    <T as tonic::client::GrpcService<tonic::body::Body>>::ResponseBody,
                >,
            >,
            <T as tonic::codegen::Service<
                http::Request<tonic::body::Body>,
            >>::Error: Into<StdError> + std::marker::Send + std::marker::Sync,
        {
            SchemaServiceClient::new(InterceptedService::new(inner, interceptor))
        }
        /// Compress requests with the given encoding.
        ///
        /// This requires the server to support it otherwise it might respond with an
        /// error.
        #[must_use]
        pub fn send_compressed(mut self, encoding: CompressionEncoding) -> Self {
            self.inner = self.inner.send_compressed(encoding);
            self
        }
        /// Enable decompressing responses.
        #[must_use]
        pub fn accept_compressed(mut self, encoding: CompressionEncoding) -> Self {
            self.inner = self.inner.accept_compressed(encoding);
            self
        }
        /// Limits the maximum size of a decoded message.
        ///
        /// Default: `4MB`
        #[must_use]
        pub fn max_decoding_message_size(mut self, limit: usize) -> Self {
            self.inner = self.inner.max_decoding_message_size(limit);
            self
        }
        /// Limits the maximum size of an encoded message.
        ///
        /// Default: `usize::MAX`
        #[must_use]
        pub fn max_encoding_message_size(mut self, limit: usize) -> Self {
            self.inner = self.inner.max_encoding_message_size(limit);
            self
        }
        pub async fn read_schema(
            &mut self,
            request: impl tonic::IntoRequest<super::ReadSchemaRequest>,
        ) -> std::result::Result<
            tonic::Response<super::ReadSchemaResponse>,
            tonic::Status,
        > {
            self.inner
                .ready()
                .await
                .map_err(|e| {
                    tonic::Status::unknown(
                        format!("Service was not ready: {}", e.into()),
                    )
                })?;
            let codec = tonic_prost::ProstCodec::default();
            let path = http::uri::PathAndQuery::from_static(
                "/authzed.api.v1.SchemaService/ReadSchema",
            );
            let mut req = request.into_request();
            req.extensions_mut()
                .insert(GrpcMethod::new("authzed.api.v1.SchemaService", "ReadSchema"));
            self.inner.unary(req, path, codec).await
        }
        pub async fn write_schema(
            &mut self,
            request: impl tonic::IntoRequest<super::WriteSchemaRequest>,
        ) -> std::result::Result<
            tonic::Response<super::WriteSchemaResponse>,
            tonic::Status,
        > {
            self.inner
                .ready()
                .await
                .map_err(|e| {
                    tonic::Status::unknown(
                        format!("Service was not ready: {}", e.into()),
                    )
                })?;
            let codec = tonic_prost::ProstCodec::default();
            let path = http::uri::PathAndQuery::from_static(
                "/authzed.api.v1.SchemaService/WriteSchema",
            );
            let mut req = request.into_request();
            req.extensions_mut()
                .insert(GrpcMethod::new("authzed.api.v1.SchemaService", "WriteSchema"));
            self.inner.unary(req, path, codec).await
        }
        pub async fn reflect_schema(
            &mut self,
            request: impl tonic::IntoRequest<super::ReflectSchemaRequest>,
        ) -> std::result::Result<
            tonic::Response<super::ReflectSchemaResponse>,
            tonic::Status,
        > {
            self.inner
                .ready()
                .await
                .map_err(|e| {
                    tonic::Status::unknown(
                        format!("Service was not ready: {}", e.into()),
                    )
                })?;
            let codec = tonic_prost::ProstCodec::default();
            let path = http::uri::PathAndQuery::from_static(
                "/authzed.api.v1.SchemaService/ReflectSchema",
            );
            let mut req = request.into_request();
            req.extensions_mut()
                .insert(
                    GrpcMethod::new("authzed.api.v1.SchemaService", "ReflectSchema"),
                );
            self.inner.unary(req, path, codec).await
        }
        pub async fn computable_permissions(
            &mut self,
            request: impl tonic::IntoRequest<super::ComputablePermissionsRequest>,
        ) -> std::result::Result<
            tonic::Response<super::ComputablePermissionsResponse>,
            tonic::Status,
        > {
            self.inner
                .ready()
                .await
                .map_err(|e| {
                    tonic::Status::unknown(
                        format!("Service was not ready: {}", e.into()),
                    )
                })?;
            let codec = tonic_prost::ProstCodec::default();
            let path = http::uri::PathAndQuery::from_static(
                "/authzed.api.v1.SchemaService/ComputablePermissions",
            );
            let mut req = request.into_request();
            req.extensions_mut()
                .insert(
                    GrpcMethod::new(
                        "authzed.api.v1.SchemaService",
                        "ComputablePermissions",
                    ),
                );
            self.inner.unary(req, path, codec).await
        }
        pub async fn dependent_relations(
            &mut self,
            request: impl tonic::IntoRequest<super::DependentRelationsRequest>,
        ) -> std::result::Result<
            tonic::Response<super::DependentRelationsResponse>,
            tonic::Status,
        > {
            self.inner
                .ready()
                .await
                .map_err(|e| {
                    tonic::Status::unknown(
                        format!("Service was not ready: {}", e.into()),
                    )
                })?;
            let codec = tonic_prost::ProstCodec::default();
            let path = http::uri::PathAndQuery::from_static(
                "/authzed.api.v1.SchemaService/DependentRelations",
            );
            let mut req = request.into_request();
            req.extensions_mut()
                .insert(
                    GrpcMethod::new("authzed.api.v1.SchemaService", "DependentRelations"),
                );
            self.inner.unary(req, path, codec).await
        }
        pub async fn diff_schema(
            &mut self,
            request: impl tonic::IntoRequest<super::DiffSchemaRequest>,
        ) -> std::result::Result<
            tonic::Response<super::DiffSchemaResponse>,
            tonic::Status,
        > {
            self.inner
                .ready()
                .await
                .map_err(|e| {
                    tonic::Status::unknown(
                        format!("Service was not ready: {}", e.into()),
                    )
                })?;
            let codec = tonic_prost::ProstCodec::default();
            let path = http::uri::PathAndQuery::from_static(
                "/authzed.api.v1.SchemaService/DiffSchema",
            );
            let mut req = request.into_request();
            req.extensions_mut()
                .insert(GrpcMethod::new("authzed.api.v1.SchemaService", "DiffSchema"));
            self.inner.unary(req, path, codec).await
        }
    }
}
/// Generated server implementations.
pub mod schema_service_server {
    #![allow(
        unused_variables,
        dead_code,
        missing_docs,
        clippy::wildcard_imports,
        clippy::let_unit_value,
    )]
    use tonic::codegen::*;
    /// Generated trait containing gRPC methods that should be implemented for use with SchemaServiceServer.
    #[async_trait]
    pub trait SchemaService: std::marker::Send + std::marker::Sync + 'static {
        async fn read_schema(
            &self,
            request: tonic::Request<super::ReadSchemaRequest>,
        ) -> std::result::Result<
            tonic::Response<super::ReadSchemaResponse>,
            tonic::Status,
        >;
        async fn write_schema(
            &self,
            request: tonic::Request<super::WriteSchemaRequest>,
        ) -> std::result::Result<
            tonic::Response<super::WriteSchemaResponse>,
            tonic::Status,
        >;
        async fn reflect_schema(
            &self,
            request: tonic::Request<super::ReflectSchemaRequest>,
        ) -> std::result::Result<
            tonic::Response<super::ReflectSchemaResponse>,
            tonic::Status,
        >;
        async fn computable_permissions(
            &self,
            request: tonic::Request<super::ComputablePermissionsRequest>,
        ) -> std::result::Result<
            tonic::Response<super::ComputablePermissionsResponse>,
            tonic::Status,
        >;
        async fn dependent_relations(
            &self,
            request: tonic::Request<super::DependentRelationsRequest>,
        ) -> std::result::Result<
            tonic::Response<super::DependentRelationsResponse>,
            tonic::Status,
        >;
        async fn diff_schema(
            &self,
            request: tonic::Request<super::DiffSchemaRequest>,
        ) -> std::result::Result<
            tonic::Response<super::DiffSchemaResponse>,
            tonic::Status,
        >;
    }
    #[derive(Debug)]
    pub struct SchemaServiceServer<T> {
        inner: Arc<T>,
        accept_compression_encodings: EnabledCompressionEncodings,
        send_compression_encodings: EnabledCompressionEncodings,
        max_decoding_message_size: Option<usize>,
        max_encoding_message_size: Option<usize>,
    }
    impl<T> SchemaServiceServer<T> {
        pub fn new(inner: T) -> Self {
            Self::from_arc(Arc::new(inner))
        }
        pub fn from_arc(inner: Arc<T>) -> Self {
            Self {
                inner,
                accept_compression_encodings: Default::default(),
                send_compression_encodings: Default::default(),
                max_decoding_message_size: None,
                max_encoding_message_size: None,
            }
        }
        pub fn with_interceptor<F>(
            inner: T,
            interceptor: F,
        ) -> InterceptedService<Self, F>
        where
            F: tonic::service::Interceptor,
        {
            InterceptedService::new(Self::new(inner), interceptor)
        }
        /// Enable decompressing requests with the given encoding.
        #[must_use]
        pub fn accept_compressed(mut self, encoding: CompressionEncoding) -> Self {
            self.accept_compression_encodings.enable(encoding);
            self
        }
        /// Compress responses with the given encoding, if the client supports it.
        #[must_use]
        pub fn send_compressed(mut self, encoding: CompressionEncoding) -> Self {
            self.send_compression_encodings.enable(encoding);
            self
        }
        /// Limits the maximum size of a decoded message.
        ///
        /// Default: `4MB`
        #[must_use]
        pub fn max_decoding_message_size(mut self, limit: usize) -> Self {
            self.max_decoding_message_size = Some(limit);
            self
        }
        /// Limits the maximum size of an encoded message.
        ///
        /// Default: `usize::MAX`
        #[must_use]
        pub fn max_encoding_message_size(mut self, limit: usize) -> Self {
            self.max_encoding_message_size = Some(limit);
            self
        }
    }
    impl<T, B> tonic::codegen::Service<http::Request<B>> for SchemaServiceServer<T>
    where
        T: SchemaService,
        B: Body + std::marker::Send + 'static,
        B::Error: Into<StdError> + std::marker::Send + 'static,
    {
        type Response = http::Response<tonic::body::Body>;
        type Error = std::convert::Infallible;
        type Future = BoxFuture<Self::Response, Self::Error>;
        fn poll_ready(
            &mut self,
            _cx: &mut Context<'_>,
        ) -> Poll<std::result::Result<(), Self::Error>> {
            Poll::Ready(Ok(()))
        }
        fn call(&mut self, req: http::Request<B>) -> Self::Future {
            match req.uri().path() {
                "/authzed.api.v1.SchemaService/ReadSchema" => {
                    #[allow(non_camel_case_types)]
                    struct ReadSchemaSvc<T: SchemaService>(pub Arc<T>);
                    impl<
                        T: SchemaService,
                    > tonic::server::UnaryService<super::ReadSchemaRequest>
                    for ReadSchemaSvc<T> {
                        type Response = super::ReadSchemaResponse;
                        type Future = BoxFuture<
                            tonic::Response<Self::Response>,
                            tonic::Status,
                        >;
                        fn call(
                            &mut self,
                            request: tonic::Request<super::ReadSchemaRequest>,
                        ) -> Self::Future {
                            let inner = Arc::clone(&self.0);
                            let fut = async move {
                                <T as SchemaService>::read_schema(&inner, request).await
                            };
                            Box::pin(fut)
                        }
                    }
                    let accept_compression_encodings = self.accept_compression_encodings;
                    let send_compression_encodings = self.send_compression_encodings;
                    let max_decoding_message_size = self.max_decoding_message_size;
                    let max_encoding_message_size = self.max_encoding_message_size;
                    let inner = self.inner.clone();
                    let fut = async move {
                        let method = ReadSchemaSvc(inner);
                        let codec = tonic_prost::ProstCodec::default();
                        let mut grpc = tonic::server::Grpc::new(codec)
                            .apply_compression_config(
                                accept_compression_encodings,
                                send_compression_encodings,
                            )
                            .apply_max_message_size_config(
                                max_decoding_message_size,
                                max_encoding_message_size,
                            );
                        let res = grpc.unary(method, req).await;
                        Ok(res)
                    };
                    Box::pin(fut)
                }
                "/authzed.api.v1.SchemaService/WriteSchema" => {
                    #[allow(non_camel_case_types)]
                    struct WriteSchemaSvc<T: SchemaService>(pub Arc<T>);
                    impl<
                        T: SchemaService,
                    > tonic::server::UnaryService<super::WriteSchemaRequest>
                    for WriteSchemaSvc<T> {
                        type Response = super::WriteSchemaResponse;
                        type Future = BoxFuture<
                            tonic::Response<Self::Response>,
                            tonic::Status,
                        >;
                        fn call(
                            &mut self,
                            request: tonic::Request<super::WriteSchemaRequest>,
                        ) -> Self::Future {
                            let inner = Arc::clone(&self.0);
                            let fut = async move {
                                <T as SchemaService>::write_schema(&inner, request).await
                            };
                            Box::pin(fut)
                        }
                    }
                    let accept_compression_encodings = self.accept_compression_encodings;
                    let send_compression_encodings = self.send_compression_encodings;
                    let max_decoding_message_size = self.max_decoding_message_size;
                    let max_encoding_message_size = self.max_encoding_message_size;
                    let inner = self.inner.clone();
                    let fut = async move {
                        let method = WriteSchemaSvc(inner);
                        let codec = tonic_prost::ProstCodec::default();
                        let mut grpc = tonic::server::Grpc::new(codec)
                            .apply_compression_config(
                                accept_compression_encodings,
                                send_compression_encodings,
                            )
                            .apply_max_message_size_config(
                                max_decoding_message_size,
                                max_encoding_message_size,
                            );
                        let res = grpc.unary(method, req).await;
                        Ok(res)
                    };
                    Box::pin(fut)
                }
                "/authzed.api.v1.SchemaService/ReflectSchema" => {
                    #[allow(non_camel_case_types)]
                    struct ReflectSchemaSvc<T: SchemaService>(pub Arc<T>);
                    impl<
                        T: SchemaService,
                    > tonic::server::UnaryService<super::ReflectSchemaRequest>
                    for ReflectSchemaSvc<T> {
                        type Response = super::ReflectSchemaResponse;
                        type Future = BoxFuture<
                            tonic::Response<Self::Response>,
                            tonic::Status,
                        >;
                        fn call(
                            &mut self,
                            request: tonic::Request<super::ReflectSchemaRequest>,
                        ) -> Self::Future {
                            let inner = Arc::clone(&self.0);
                            let fut = async move {
                                <T as SchemaService>::reflect_schema(&inner, request).await
                            };
                            Box::pin(fut)
                        }
                    }
                    let accept_compression_encodings = self.accept_compression_encodings;
                    let send_compression_encodings = self.send_compression_encodings;
                    let max_decoding_message_size = self.max_decoding_message_size;
                    let max_encoding_message_size = self.max_encoding_message_size;
                    let inner = self.inner.clone();
                    let fut = async move {
                        let method = ReflectSchemaSvc(inner);
                        let codec = tonic_prost::ProstCodec::default();
                        let mut grpc = tonic::server::Grpc::new(codec)
                            .apply_compression_config(
                                accept_compression_encodings,
                                send_compression_encodings,
                            )
                            .apply_max_message_size_config(
                                max_decoding_message_size,
                                max_encoding_message_size,
                            );
                        let res = grpc.unary(method, req).await;
                        Ok(res)
                    };
                    Box::pin(fut)
                }
                "/authzed.api.v1.SchemaService/ComputablePermissions" => {
                    #[allow(non_camel_case_types)]
                    struct ComputablePermissionsSvc<T: SchemaService>(pub Arc<T>);
                    impl<
                        T: SchemaService,
                    > tonic::server::UnaryService<super::ComputablePermissionsRequest>
                    for ComputablePermissionsSvc<T> {
                        type Response = super::ComputablePermissionsResponse;
                        type Future = BoxFuture<
                            tonic::Response<Self::Response>,
                            tonic::Status,
                        >;
                        fn call(
                            &mut self,
                            request: tonic::Request<super::ComputablePermissionsRequest>,
                        ) -> Self::Future {
                            let inner = Arc::clone(&self.0);
                            let fut = async move {
                                <T as SchemaService>::computable_permissions(
                                        &inner,
                                        request,
                                    )
                                    .await
                            };
                            Box::pin(fut)
                        }
                    }
                    let accept_compression_encodings = self.accept_compression_encodings;
                    let send_compression_encodings = self.send_compression_encodings;
                    let max_decoding_message_size = self.max_decoding_message_size;
                    let max_encoding_message_size = self.max_encoding_message_size;
                    let inner = self.inner.clone();
                    let fut = async move {
                        let method = ComputablePermissionsSvc(inner);
                        let codec = tonic_prost::ProstCodec::default();
                        let mut grpc = tonic::server::Grpc::new(codec)
                            .apply_compression_config(
                                accept_compression_encodings,
                                send_compression_encodings,
                            )
                            .apply_max_message_size_config(
                                max_decoding_message_size,
                                max_encoding_message_size,
                            );
                        let res = grpc.unary(method, req).await;
                        Ok(res)
                    };
                    Box::pin(fut)
                }
                "/authzed.api.v1.SchemaService/DependentRelations" => {
                    #[allow(non_camel_case_types)]
                    struct DependentRelationsSvc<T: SchemaService>(pub Arc<T>);
                    impl<
                        T: SchemaService,
                    > tonic::server::UnaryService<super::DependentRelationsRequest>
                    for DependentRelationsSvc<T> {
                        type Response = super::DependentRelationsResponse;
                        type Future = BoxFuture<
                            tonic::Response<Self::Response>,
                            tonic::Status,
                        >;
                        fn call(
                            &mut self,
                            request: tonic::Request<super::DependentRelationsRequest>,
                        ) -> Self::Future {
                            let inner = Arc::clone(&self.0);
                            let fut = async move {
                                <T as SchemaService>::dependent_relations(&inner, request)
                                    .await
                            };
                            Box::pin(fut)
                        }
                    }
                    let accept_compression_encodings = self.accept_compression_encodings;
                    let send_compression_encodings = self.send_compression_encodings;
                    let max_decoding_message_size = self.max_decoding_message_size;
                    let max_encoding_message_size = self.max_encoding_message_size;
                    let inner = self.inner.clone();
                    let fut = async move {
                        let method = DependentRelationsSvc(inner);
                        let codec = tonic_prost::ProstCodec::default();
                        let mut grpc = tonic::server::Grpc::new(codec)
                            .apply_compression_config(
                                accept_compression_encodings,
                                send_compression_encodings,
                            )
                            .apply_max_message_size_config(
                                max_decoding_message_size,
                                max_encoding_message_size,
                            );
                        let res = grpc.unary(method, req).await;
                        Ok(res)
                    };
                    Box::pin(fut)
                }
                "/authzed.api.v1.SchemaService/DiffSchema" => {
                    #[allow(non_camel_case_types)]
                    struct DiffSchemaSvc<T: SchemaService>(pub Arc<T>);
                    impl<
                        T: SchemaService,
                    > tonic::server::UnaryService<super::DiffSchemaRequest>
                    for DiffSchemaSvc<T> {
                        type Response = super::DiffSchemaResponse;
                        type Future = BoxFuture<
                            tonic::Response<Self::Response>,
                            tonic::Status,
                        >;
                        fn call(
                            &mut self,
                            request: tonic::Request<super::DiffSchemaRequest>,
                        ) -> Self::Future {
                            let inner = Arc::clone(&self.0);
                            let fut = async move {
                                <T as SchemaService>::diff_schema(&inner, request).await
                            };
                            Box::pin(fut)
                        }
                    }
                    let accept_compression_encodings = self.accept_compression_encodings;
                    let send_compression_encodings = self.send_compression_encodings;
                    let max_decoding_message_size = self.max_decoding_message_size;
                    let max_encoding_message_size = self.max_encoding_message_size;
                    let inner = self.inner.clone();
                    let fut = async move {
                        let method = DiffSchemaSvc(inner);
                        let codec = tonic_prost::ProstCodec::default();
                        let mut grpc = tonic::server::Grpc::new(codec)
                            .apply_compression_config(
                                accept_compression_encodings,
                                send_compression_encodings,
                            )
                            .apply_max_message_size_config(
                                max_decoding_message_size,
                                max_encoding_message_size,
                            );
                        let res = grpc.unary(method, req).await;
                        Ok(res)
                    };
                    Box::pin(fut)
                }
                _ => {
                    Box::pin(async move {
                        let mut response = http::Response::new(
                            tonic::body::Body::default(),
                        );
                        let headers = response.headers_mut();
                        headers
                            .insert(
                                tonic::Status::GRPC_STATUS,
                                (tonic::Code::Unimplemented as i32).into(),
                            );
                        headers
                            .insert(
                                http::header::CONTENT_TYPE,
                                tonic::metadata::GRPC_CONTENT_TYPE,
                            );
                        Ok(response)
                    })
                }
            }
        }
    }
    impl<T> Clone for SchemaServiceServer<T> {
        fn clone(&self) -> Self {
            let inner = self.inner.clone();
            Self {
                inner,
                accept_compression_encodings: self.accept_compression_encodings,
                send_compression_encodings: self.send_compression_encodings,
                max_decoding_message_size: self.max_decoding_message_size,
                max_encoding_message_size: self.max_encoding_message_size,
            }
        }
    }
    /// Generated gRPC service name
    pub const SERVICE_NAME: &str = "authzed.api.v1.SchemaService";
    impl<T> tonic::server::NamedService for SchemaServiceServer<T> {
        const NAME: &'static str = SERVICE_NAME;
    }
}
/// Generated client implementations.
pub mod watch_service_client {
    #![allow(
        unused_variables,
        dead_code,
        missing_docs,
        clippy::wildcard_imports,
        clippy::let_unit_value,
    )]
    use tonic::codegen::*;
    use tonic::codegen::http::Uri;
    #[derive(Debug, Clone)]
    pub struct WatchServiceClient<T> {
        inner: tonic::client::Grpc<T>,
    }
    impl WatchServiceClient<tonic::transport::Channel> {
        /// Attempt to create a new client by connecting to a given endpoint.
        pub async fn connect<D>(dst: D) -> Result<Self, tonic::transport::Error>
        where
            D: TryInto<tonic::transport::Endpoint>,
            D::Error: Into<StdError>,
        {
            let conn = tonic::transport::Endpoint::new(dst)?.connect().await?;
            Ok(Self::new(conn))
        }
    }
    impl<T> WatchServiceClient<T>
    where
        T: tonic::client::GrpcService<tonic::body::Body>,
        T::Error: Into<StdError>,
        T::ResponseBody: Body<Data = Bytes> + std::marker::Send + 'static,
        <T::ResponseBody as Body>::Error: Into<StdError> + std::marker::Send,
    {
        pub fn new(inner: T) -> Self {
            let inner = tonic::client::Grpc::new(inner);
            Self { inner }
        }
        pub fn with_origin(inner: T, origin: Uri) -> Self {
            let inner = tonic::client::Grpc::with_origin(inner, origin);
            Self { inner }
        }
        pub fn with_interceptor<F>(
            inner: T,
            interceptor: F,
        ) -> WatchServiceClient<InterceptedService<T, F>>
        where
            F: tonic::service::Interceptor,
            T::ResponseBody: Default,
            T: tonic::codegen::Service<
                http::Request<tonic::body::Body>,
                Response = http::Response<
                    <T as tonic::client::GrpcService<tonic::body::Body>>::ResponseBody,
                >,
            >,
            <T as tonic::codegen::Service<
                http::Request<tonic::body::Body>,
            >>::Error: Into<StdError> + std::marker::Send + std::marker::Sync,
        {
            WatchServiceClient::new(InterceptedService::new(inner, interceptor))
        }
        /// Compress requests with the given encoding.
        ///
        /// This requires the server to support it otherwise it might respond with an
        /// error.
        #[must_use]
        pub fn send_compressed(mut self, encoding: CompressionEncoding) -> Self {
            self.inner = self.inner.send_compressed(encoding);
            self
        }
        /// Enable decompressing responses.
        #[must_use]
        pub fn accept_compressed(mut self, encoding: CompressionEncoding) -> Self {
            self.inner = self.inner.accept_compressed(encoding);
            self
        }
        /// Limits the maximum size of a decoded message.
        ///
        /// Default: `4MB`
        #[must_use]
        pub fn max_decoding_message_size(mut self, limit: usize) -> Self {
            self.inner = self.inner.max_decoding_message_size(limit);
            self
        }
        /// Limits the maximum size of an encoded message.
        ///
        /// Default: `usize::MAX`
        #[must_use]
        pub fn max_encoding_message_size(mut self, limit: usize) -> Self {
            self.inner = self.inner.max_encoding_message_size(limit);
            self
        }
        pub async fn watch(
            &mut self,
            request: impl tonic::IntoRequest<super::WatchRequest>,
        ) -> std::result::Result<
            tonic::Response<tonic::codec::Streaming<super::WatchResponse>>,
            tonic::Status,
        > {
            self.inner
                .ready()
                .await
                .map_err(|e| {
                    tonic::Status::unknown(
                        format!("Service was not ready: {}", e.into()),
                    )
                })?;
            let codec = tonic_prost::ProstCodec::default();
            let path = http::uri::PathAndQuery::from_static(
                "/authzed.api.v1.WatchService/Watch",
            );
            let mut req = request.into_request();
            req.extensions_mut()
                .insert(GrpcMethod::new("authzed.api.v1.WatchService", "Watch"));
            self.inner.server_streaming(req, path, codec).await
        }
    }
}
/// Generated server implementations.
pub mod watch_service_server {
    #![allow(
        unused_variables,
        dead_code,
        missing_docs,
        clippy::wildcard_imports,
        clippy::let_unit_value,
    )]
    use tonic::codegen::*;
    /// Generated trait containing gRPC methods that should be implemented for use with WatchServiceServer.
    #[async_trait]
    pub trait WatchService: std::marker::Send + std::marker::Sync + 'static {
        /// Server streaming response type for the Watch method.
        type WatchStream: tonic::codegen::tokio_stream::Stream<
                Item = std::result::Result<super::WatchResponse, tonic::Status>,
            >
            + std::marker::Send
            + 'static;
        async fn watch(
            &self,
            request: tonic::Request<super::WatchRequest>,
        ) -> std::result::Result<tonic::Response<Self::WatchStream>, tonic::Status>;
    }
    #[derive(Debug)]
    pub struct WatchServiceServer<T> {
        inner: Arc<T>,
        accept_compression_encodings: EnabledCompressionEncodings,
        send_compression_encodings: EnabledCompressionEncodings,
        max_decoding_message_size: Option<usize>,
        max_encoding_message_size: Option<usize>,
    }
    impl<T> WatchServiceServer<T> {
        pub fn new(inner: T) -> Self {
            Self::from_arc(Arc::new(inner))
        }
        pub fn from_arc(inner: Arc<T>) -> Self {
            Self {
                inner,
                accept_compression_encodings: Default::default(),
                send_compression_encodings: Default::default(),
                max_decoding_message_size: None,
                max_encoding_message_size: None,
            }
        }
        pub fn with_interceptor<F>(
            inner: T,
            interceptor: F,
        ) -> InterceptedService<Self, F>
        where
            F: tonic::service::Interceptor,
        {
            InterceptedService::new(Self::new(inner), interceptor)
        }
        /// Enable decompressing requests with the given encoding.
        #[must_use]
        pub fn accept_compressed(mut self, encoding: CompressionEncoding) -> Self {
            self.accept_compression_encodings.enable(encoding);
            self
        }
        /// Compress responses with the given encoding, if the client supports it.
        #[must_use]
        pub fn send_compressed(mut self, encoding: CompressionEncoding) -> Self {
            self.send_compression_encodings.enable(encoding);
            self
        }
        /// Limits the maximum size of a decoded message.
        ///
        /// Default: `4MB`
        #[must_use]
        pub fn max_decoding_message_size(mut self, limit: usize) -> Self {
            self.max_decoding_message_size = Some(limit);
            self
        }
        /// Limits the maximum size of an encoded message.
        ///
        /// Default: `usize::MAX`
        #[must_use]
        pub fn max_encoding_message_size(mut self, limit: usize) -> Self {
            self.max_encoding_message_size = Some(limit);
            self
        }
    }
    impl<T, B> tonic::codegen::Service<http::Request<B>> for WatchServiceServer<T>
    where
        T: WatchService,
        B: Body + std::marker::Send + 'static,
        B::Error: Into<StdError> + std::marker::Send + 'static,
    {
        type Response = http::Response<tonic::body::Body>;
        type Error = std::convert::Infallible;
        type Future = BoxFuture<Self::Response, Self::Error>;
        fn poll_ready(
            &mut self,
            _cx: &mut Context<'_>,
        ) -> Poll<std::result::Result<(), Self::Error>> {
            Poll::Ready(Ok(()))
        }
        fn call(&mut self, req: http::Request<B>) -> Self::Future {
            match req.uri().path() {
                "/authzed.api.v1.WatchService/Watch" => {
                    #[allow(non_camel_case_types)]
                    struct WatchSvc<T: WatchService>(pub Arc<T>);
                    impl<
                        T: WatchService,
                    > tonic::server::ServerStreamingService<super::WatchRequest>
                    for WatchSvc<T> {
                        type Response = super::WatchResponse;
                        type ResponseStream = T::WatchStream;
                        type Future = BoxFuture<
                            tonic::Response<Self::ResponseStream>,
                            tonic::Status,
                        >;
                        fn call(
                            &mut self,
                            request: tonic::Request<super::WatchRequest>,
                        ) -> Self::Future {
                            let inner = Arc::clone(&self.0);
                            let fut = async move {
                                <T as WatchService>::watch(&inner, request).await
                            };
                            Box::pin(fut)
                        }
                    }
                    let accept_compression_encodings = self.accept_compression_encodings;
                    let send_compression_encodings = self.send_compression_encodings;
                    let max_decoding_message_size = self.max_decoding_message_size;
                    let max_encoding_message_size = self.max_encoding_message_size;
                    let inner = self.inner.clone();
                    let fut = async move {
                        let method = WatchSvc(inner);
                        let codec = tonic_prost::ProstCodec::default();
                        let mut grpc = tonic::server::Grpc::new(codec)
                            .apply_compression_config(
                                accept_compression_encodings,
                                send_compression_encodings,
                            )
                            .apply_max_message_size_config(
                                max_decoding_message_size,
                                max_encoding_message_size,
                            );
                        let res = grpc.server_streaming(method, req).await;
                        Ok(res)
                    };
                    Box::pin(fut)
                }
                _ => {
                    Box::pin(async move {
                        let mut response = http::Response::new(
                            tonic::body::Body::default(),
                        );
                        let headers = response.headers_mut();
                        headers
                            .insert(
                                tonic::Status::GRPC_STATUS,
                                (tonic::Code::Unimplemented as i32).into(),
                            );
                        headers
                            .insert(
                                http::header::CONTENT_TYPE,
                                tonic::metadata::GRPC_CONTENT_TYPE,
                            );
                        Ok(response)
                    })
                }
            }
        }
    }
    impl<T> Clone for WatchServiceServer<T> {
        fn clone(&self) -> Self {
            let inner = self.inner.clone();
            Self {
                inner,
                accept_compression_encodings: self.accept_compression_encodings,
                send_compression_encodings: self.send_compression_encodings,
                max_decoding_message_size: self.max_decoding_message_size,
                max_encoding_message_size: self.max_encoding_message_size,
            }
        }
    }
    /// Generated gRPC service name
    pub const SERVICE_NAME: &str = "authzed.api.v1.WatchService";
    impl<T> tonic::server::NamedService for WatchServiceServer<T> {
        const NAME: &'static str = SERVICE_NAME;
    }
}
