//! Generated SpiceDB gRPC API bindings.

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
