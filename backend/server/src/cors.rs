use rocket_cors::{AllowedHeaders, AllowedOrigins, Cors};

pub fn cors() -> Cors {
    let cors = rocket_cors::CorsOptions {
        allowed_origins: AllowedOrigins::All,
        allowed_methods: {
            // why do i have to do this, honestly
            use rocket::http::Method::*;
            vec![Get, Put, Post, Delete, Options, Head, Trace, Connect, Patch]
                .into_iter()
                .map(From::from)
                .collect()
        },
        allowed_headers: AllowedHeaders::All,
        ..Default::default()
    }
    .to_cors()
    .expect("Failed to create CORS options");

    cors
}
