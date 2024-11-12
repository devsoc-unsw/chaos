use crate::handler::auth::google_callback;
use handler::user::UserHandler;
use crate::handler::campaign::CampaignHandler;
use crate::handler::organisation::OrganisationHandler;
use crate::handler::application::ApplicationHandler;
use crate::models::storage::Storage;
use anyhow::Result;
use axum::routing::{get, patch, post, put};
use axum::Router;
use handler::rating::RatingHandler;
use handler::role::RoleHandler;
use jsonwebtoken::{Algorithm, DecodingKey, EncodingKey, Header, Validation};
use models::app::AppState;
use snowflake::SnowflakeIdGenerator;
use sqlx::postgres::PgPoolOptions;
use std::env;
use crate::handler::question::QuestionHandler;

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
        .route("/api/v1/user", get(UserHandler::get))
        .route("/api/v1/user/name", patch(UserHandler::update_name))
        .route("/api/v1/user/pronouns", patch(UserHandler::update_pronouns))
        .route("/api/v1/user/gender", patch(UserHandler::update_gender))
        .route("/api/v1/user/zid", patch(UserHandler::update_zid))
        .route("/api/v1/user/degree", patch(UserHandler::update_degree))
        .route(
            "/api/v1/user/applications",
            get(ApplicationHandler::get_from_curr_user),
        )
        .route("/api/v1/organisation", post(OrganisationHandler::create))
        .route(
            "/api/v1/organisation/:organisation_id",
            get(OrganisationHandler::get).delete(OrganisationHandler::delete),
        )
        .route(
            "/api/v1/organisation/:organisation_id/campaign",
            post(OrganisationHandler::create_campaign),
        )
        .route(
            "/api/v1/organisation/:organisation_id/campaigns",
            get(OrganisationHandler::get_campaigns),
        )
        .route(
            "/api/v1/organisation/:organisation_id/logo",
            patch(OrganisationHandler::update_logo),
        )
        .route(
            "/api/v1/organisation/:organisation_id/member",
            get(OrganisationHandler::get_members)
                .put(OrganisationHandler::update_members)
                .delete(OrganisationHandler::remove_member),
        )
        .route(
            "/api/v1/organisation/:organisation_id/admin",
            get(OrganisationHandler::get_admins)
                .put(OrganisationHandler::update_admins)
                .delete(OrganisationHandler::remove_admin),
        )
        .route(
            "/api/v1/ratings/:rating_id",
            get(RatingHandler::get)
                .delete(RatingHandler::delete)
                .put(RatingHandler::update),
        )
        .route(
            "/api/v1/:application_id/rating",
            post(RatingHandler::create),
        )
        .route(
            "/api/v1/:application_id/ratings",
            get(RatingHandler::get_ratings_for_application),
        )
        .route(
            "/api/v1/campaign/:campaign_id/role",
            post(CampaignHandler::create_role),
        )
        .route("/api/v1/campaign/:campaign_id/role/:role_id/questions", get(QuestionHandler::get_all_by_campaign_and_role))
        .route(
            "/api/v1/campaign/:campaign_id/roles",
            get(CampaignHandler::get_roles),
        )
        .route(
            "/api/v1/campaign/:campaign_id/applications",
            get(CampaignHandler::get_applications),
        )
        .route(
            "/api/v1/role/:role_id",
            get(RoleHandler::get)
                .put(RoleHandler::update)
                .delete(RoleHandler::delete),
        )
        .route(
            "/api/v1/role/:role_id/applications",
            get(RoleHandler::get_applications)
        )
        .route(
            "/api/v1/campaign/:campaign_id",
            get(CampaignHandler::get)
                .put(CampaignHandler::update)
                .delete(CampaignHandler::delete),
        )
        .route("/api/v1/campaign", get(CampaignHandler::get_all))
        .route("/api/v1/campaign/:campaign_id/question", post(QuestionHandler::create))
        .route("/api/v1/campaign/:campaign_id/question/:id", put(QuestionHandler::update).delete(QuestionHandler::delete))
        .route("/api/v1/campaign/:campaign_id/questions/common", get(QuestionHandler::get_all_common_by_campaign))
        .route(
            "/api/v1/campaign/:campaign_id/banner",
            patch(CampaignHandler::update_banner),
        )
        .route("api/v1/campaign/:campaign_id/application",
            post(CampaignHandler::create_application)
        )
        .route("api/v1/application/:application_id", get(ApplicationHandler::get))
        .route("api/v1/application/:application_id/status", patch(ApplicationHandler::set_status))
        .route("api/v1/application/:application_id/private", patch(ApplicationHandler::set_private_status))
        .with_state(state);

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap();
    axum::serve(listener, app).await.unwrap();

    Ok(())
}
