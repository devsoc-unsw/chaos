use axum::{routing::get, Router};
use jsonwebtoken::{DecodingKey, EncodingKey};
use models::app::AppState;
mod handler;
mod models;
mod service;

#[tokio::main]
async fn main() {
    // Initialise JWT settings

    /*
    let jwt_secret = env::var("JWT_SECRET")
        .expect("Error getting JWT_SECRET")
        .to_string();
    */

    let jwt_secret = "I want to cry";
    let encoding_key = EncodingKey::from_secret(jwt_secret.as_bytes());
    let decoding_key = DecodingKey::from_secret(jwt_secret.as_bytes());

    // TODO: create context, connect to db, return jwt's
    let state = AppState {
        encoding_key,
        decoding_key,
    };

    let app = Router::new()
        .route("/", get(|| async { "Hello, World!" }))
        .with_state(state);

    axum::Server::bind(&"0.0.0.0:3000".parse().unwrap())
        .serve(app.into_make_service())
        .await
        .unwrap();
}
