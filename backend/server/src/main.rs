#![feature(adt_const_params)]

use crate::handler::auth::google_callback;
use crate::handler::organisation::OrganisationHandler;
use crate::models::storage::Storage;
use anyhow::Result;
use axum::{Router, Extension};
use jsonwebtoken::{Algorithm, DecodingKey, EncodingKey, Header, Validation};
use models::app::AppState;
use snowflake::SnowflakeIdGenerator;
use sqlx::postgres::PgPoolOptions;
use std::env;

use axum::Json;
use aide::OperationOutput;
use aide::{
    axum::{
        routing::{get, post, patch, put},
        ApiRouter, IntoApiResponse,
    },
    openapi::{Info, OpenApi},
};

mod handler;
mod models;
mod service;

async fn serve_api(Extension(api): Extension<OpenApi>) -> impl IntoApiResponse {
    Json(api)
}

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

	let mut api = OpenApi {
		info: Info {
			description: Some("an example API".to_string()),
			..Info::default()
		},
		..OpenApi::default()
    };

    let app = ApiRouter::new()
        .route("/", get(|| async { "Hello, World!" }))
		.route("/api.json", get(serve_api))
        //.route("/api/auth/callback/google", get(google_callback))
        .api_route("/api/v1/organisation", post(OrganisationHandler::create))
        .api_route(
            "/api/v1/organisation/:id",
            get(OrganisationHandler::get).delete(OrganisationHandler::delete),
        )
        .api_route(
            "/api/v1/organisation/:id/campaign",
            get(OrganisationHandler::get_campaigns).post(OrganisationHandler::create_campaign),
        )
        .api_route(
            "/api/v1/organisation/:id/logo",
            patch(OrganisationHandler::update_logo),
        )
        .api_route(
            "/api/v1/organisation/:id/member",
            get(OrganisationHandler::get_members)
                .put(OrganisationHandler::update_members)
                .delete(OrganisationHandler::remove_member),
        )
        .api_route(
            "/api/v1/organisation/:id/admin",
            get(OrganisationHandler::get_admins)
                .put(OrganisationHandler::update_admins)
                .delete(OrganisationHandler::remove_admin),
        )
        .with_state(state);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, 
		app.finish_api(&mut api)
		.layer(Extension(api))
		.into_make_service()).await.unwrap();

    Ok(())
}
