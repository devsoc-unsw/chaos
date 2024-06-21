use anyhow::Result;
use axum::routing::patch;
use axum::{routing::get, routing::post, Router};
use jsonwebtoken::{DecodingKey, EncodingKey};
use models::app::AppState;
use snowflake::SnowflakeIdGenerator;
use sqlx::postgres::PgPoolOptions;
use std::env;

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
        .connect(db_url.as_str())
        .await
        .expect("Cannot connect to database");

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
        .route(
            "/api/v1/organisation",
            post(handler::organisation::create_organisation),
        )
        .route(
            "/api/v1/organisation/:organisation_id",
            get(handler::organisation::get_organisation)
                .delete(handler::organisation::delete_organisation),
        )
        .route(
            "/api/v1/organisation/:organisation_id/campaigns",
            get(handler::organisation::get_organisation_campaigns),
        )
        .route(
            "/api/v1/organisation/:organisation_id/logo",
            patch(handler::organisation::update_organisation_logo),
        )
        .route(
            "/api/v1/organisation/:organisation_id/members",
            get(handler::organisation::get_organisation_admins)
                .put(handler::organisation::update_organisation_admins),
        )
        .route(
            "/api/v1/organisation/:organisation_id/campaign",
            post(handler::organisation::create_campaign_for_organisation),
        )
        .with_state(state);

    axum::Server::bind(&"0.0.0.0:3000".parse().unwrap())
        .serve(app.into_make_service())
        .await
        .unwrap();

    Ok(())
}
