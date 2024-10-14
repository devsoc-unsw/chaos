use crate::handler::auth::google_callback;
use crate::handler::organisation::OrganisationHandler;
use crate::models::storage::Storage;
use anyhow::Result;
use axum::routing::{delete, get, patch, post, put};
use axum::Router;
use handler::ratings::RatingsHandler;
use jsonwebtoken::{Algorithm, DecodingKey, EncodingKey, Header, Validation};
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
    let jwt_header = Header::new(Algorithm::HS512);
    let mut jwt_validator = Validation::new(Algorithm::HS512);
    jwt_validator.set_issuer(&["Chaos"]);
    jwt_validator.set_audience(&["chaos.devsoc.app"]);

    // Initialise reqwest client
    let ctx = reqwest::Client::new();

    // Initialise Snowflake Generator
    let snowflake_generator = SnowflakeIdGenerator::new(1, 1);

    // Initialise S3 bucket
    let storage_bucket = Storage::init_bucket();

    // Add all data to AppState
    let state = AppState {
        db: pool,
        ctx,
        encoding_key,
        decoding_key,
        jwt_header,
        jwt_validator,
        snowflake_generator,
        storage_bucket,
    };

    let app = Router::new()
        .route("/", get(|| async { "Hello, World!" }))
        .route("/api/auth/callback/google", get(google_callback))
        .route("/api/v1/organisation", post(OrganisationHandler::create))
        .route(
            "/api/v1/organisation/:id",
            get(OrganisationHandler::get).delete(OrganisationHandler::delete),
        )
        .route(
            "/api/v1/organisation/:id/campaign",
            get(OrganisationHandler::get_campaigns).post(OrganisationHandler::create_campaign),
        )
        .route(
            "/api/v1/organisation/:id/logo",
            patch(OrganisationHandler::update_logo),
        )
        .route(
            "/api/v1/organisation/:id/member",
            get(OrganisationHandler::get_members)
                .put(OrganisationHandler::update_members)
                .delete(OrganisationHandler::remove_member),
        )
        .route(
            "/api/v1/organisation/:id/admin",
            get(OrganisationHandler::get_admins)
                .put(OrganisationHandler::update_admins)
                .delete(OrganisationHandler::remove_admin),
        )
        .route(
            "/api/v1/ratings/:rating_id",
            get(RatingsHandler::get)
                .delete(RatingsHandler::delete)
                .put(RatingsHandler::update),
        )
        .route(
            "/api/v1/:application_id/rating",
            post(RatingsHandler::create_rating),
        )
        .route(
            "/api/v1/:application_id/ratings",
            get(RatingsHandler::get_ratings_for_application),
        )
        .with_state(state);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();

    Ok(())
}
