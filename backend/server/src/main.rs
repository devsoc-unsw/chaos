use std::env;
use anyhow::Result;
use axum::{routing::get, Router};
use jsonwebtoken::{DecodingKey, EncodingKey};
use snowflake::SnowflakeIdGenerator;
use sqlx::postgres::PgPoolOptions;
use models::app::AppState;
mod handler;
mod models;
mod service;

#[tokio::main]
async fn main() -> Result<()> {
    dotenvy::dotenv()?;

    // Initialise DB connection
    let db_url = env::var("DATABASE_URL")
        .expect("Error getting DATABASE_URL")
        .to_string();
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(db_url.as_str()).await.expect("Cannot connect to database");

    // Initialise JWT settings
    let jwt_secret = env::var("JWT_SECRET")
        .expect("Error getting JWT_SECRET")
        .to_string();
    // let jwt_secret = "I want to cry";
    let encoding_key = EncodingKey::from_secret(jwt_secret.as_bytes());
    let decoding_key = DecodingKey::from_secret(jwt_secret.as_bytes());

    // Initialise reqwest client
    let ctx = reqwest::Client::new();

    // Initialise Snowflake Generator
    let snowflake_generator = SnowflakeIdGenerator::new(1, 1);

    // Add all data to AppState
    let state = AppState {
        db: pool,
        ctx,
        encoding_key,
        decoding_key,
        snowflake_generator,
    };

    let app = Router::new()
        .route("/", get(|| async { "Hello, World!" }))
        .with_state(state);

    axum::Server::bind(&"0.0.0.0:3000".parse().unwrap())
        .serve(app.into_make_service())
        .await
        .unwrap();

    Ok(())
}
