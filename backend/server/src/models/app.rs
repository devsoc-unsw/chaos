use crate::handler::answer::AnswerHandler;
use crate::handler::application::ApplicationHandler;
use crate::handler::auth::{google_callback, google_auth_init, DevLoginHandler};
use crate::handler::campaign::CampaignHandler;
use crate::handler::email_template::EmailTemplateHandler;
use crate::handler::offer::OfferHandler;
use crate::handler::organisation::OrganisationHandler;
use crate::handler::question::QuestionHandler;
use crate::handler::rating::RatingHandler;
use crate::handler::role::RoleHandler;
use crate::handler::invite::InviteHandler;
use crate::handler::user::UserHandler;
use crate::models::email::{ChaosEmail, EmailCredentials};
use crate::models::error::ChaosError;
use crate::models::storage::Storage;
use axum::routing::{delete, get, patch, post};
use axum::{Json, Router};
use jsonwebtoken::{Algorithm, DecodingKey, EncodingKey, Header, Validation};
use reqwest::Client as ReqwestClient;
use s3::Bucket;
use snowflake::SnowflakeIdGenerator;
use sqlx::postgres::PgPoolOptions;
use sqlx::{Pool, Postgres};
use std::env;
use axum::http::{header, Method, StatusCode};
use axum::response::IntoResponse;
use oauth2::basic::BasicClient;
use serde::Serialize;
use tower_http::cors::CorsLayer;
use crate::service::oauth2::build_oauth_client;


#[derive(Serialize)]
pub enum AppMessage<T: Serialize> {
    OkMessage(T),
    BadRequestMessage(T),
    NotFoundMessage(T),
    ErrorMessage(T),
    NotLoggedInMessage(T),
    UnauthorizedMessage(T),
}

#[derive(Serialize)]
pub struct MessageWrapper<T: Serialize> {
    message: T,
}

#[derive(Serialize)]
pub struct ErrorMessageWrapper<T: Serialize> {
    error: T,
}

impl<T: Serialize> IntoResponse for AppMessage<T> {
    fn into_response(self) -> axum::response::Response {
        match self {
            Self::OkMessage(value) => {
                (StatusCode::OK, Json(MessageWrapper { message: value })).into_response()
            }
            Self::BadRequestMessage(value) => (
                StatusCode::BAD_REQUEST,
                Json(ErrorMessageWrapper { error: value }),
            )
                .into_response(),
            Self::NotFoundMessage(value) => (
                StatusCode::NOT_FOUND,
                Json(ErrorMessageWrapper { error: value }),
            )
                .into_response(),
            Self::ErrorMessage(value) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ErrorMessageWrapper { error: value }),
            )
                .into_response(),
            Self::NotLoggedInMessage(value) => (
                StatusCode::UNAUTHORIZED,
                Json(ErrorMessageWrapper { error: value }),
            )
                .into_response(),
            Self::UnauthorizedMessage(value) => (
                StatusCode::FORBIDDEN,
                Json(ErrorMessageWrapper { error: value }),
            )
                .into_response(),
        }
    }
}

#[derive(Serialize)]
pub struct IdMessage {
    #[serde(serialize_with = "crate::models::serde_string::serialize")]
    pub id: i64,
}

#[derive(Clone)]
pub struct AppState {
    pub db: Pool<Postgres>,
    pub ctx: ReqwestClient,
    pub oauth2_client: BasicClient,
    pub decoding_key: DecodingKey,
    pub encoding_key: EncodingKey,
    pub jwt_header: Header,
    pub jwt_validator: Validation,
    pub snowflake_generator: SnowflakeIdGenerator,
    pub storage_bucket: Bucket,
    pub is_dev_env: bool,
    pub email_credentials: EmailCredentials,
}

pub async fn init_app_state() -> AppState {
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

    // Initialise oauth2 client
    let client_id = env::var("GOOGLE_CLIENT_ID")
        .expect("Error getting GOOGLE_CLIENT_ID")
        .to_string();
    let client_secret = env::var("GOOGLE_CLIENT_SECRET")
        .expect("Error getting GOOGLE_CLIENT_SECRET")
        .to_string();
    let oauth2_client = build_oauth_client(client_id, client_secret);

    let dev_env = env::var("DEV_ENV")
        .expect("Error getting DEV_ENV")
        .to_string();

    let mut is_dev_env = false;

    if dev_env == "dev" {
        is_dev_env = true;
    }

    // Initialise Snowflake Generator
    let snowflake_generator = SnowflakeIdGenerator::new(1, 1);

    // Initialise S3 bucket
    let storage_bucket = Storage::init_bucket();

    // Initialise email credentials
    let email_credentials = ChaosEmail::setup_credentials();

    // Add all data to AppState
    let state = AppState {
        db: pool,
        ctx,
        oauth2_client,
        encoding_key,
        decoding_key,
        jwt_header,
        jwt_validator,
        snowflake_generator,
        storage_bucket,
        is_dev_env,
        email_credentials,
    };
    
    state
}

pub async fn app() -> Result<Router, ChaosError> {
    
    let state = init_app_state().await;

    let cors = CorsLayer::new()
        .allow_methods([Method::GET, Method::POST, Method::DELETE, Method::PUT, Method::PATCH])
        .allow_headers([header::ACCEPT, header::COOKIE, header::SET_COOKIE, header::CONTENT_TYPE])
        .allow_credentials(true)
        .allow_origin([
            "http://localhost".parse().unwrap(),
            "http://localhost:3000".parse().unwrap(),
            "https://chaos.devsoc.app".parse().unwrap(),
            "http://chaos.devsoc.app".parse().unwrap(),
            "https://chaosstaging.devsoc.app".parse().unwrap(),
            "http://chaosstaging.devsoc.app".parse().unwrap(),
        ]);

    Ok(Router::new()
        .route("/", get(|| async { "Join DevSoc! https://devsoc.app/" }))
        .route("/auth/google", get(google_auth_init))
        .route("/api/auth/callback/google", get(google_callback))
        .route("/api/v1/dev/super_admin_login", get(DevLoginHandler::dev_super_admin_login))
        .route("/api/v1/dev/org_admin_login", get(DevLoginHandler::dev_org_admin_login))
        .route("/api/v1/dev/user_login", get(DevLoginHandler::dev_user_login))
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
        .route("/api/v1/user/organisations", get(OrganisationHandler::get_all_for_user))
        .route("/api/v1/organisation", post(OrganisationHandler::create))
        .route(
            "/api/v1/organisation/slug_check",
            post(OrganisationHandler::check_organisation_slug_availability),
        )
        .route(
            "/api/v1/organisation/:organisation_id",
            get(OrganisationHandler::get).delete(OrganisationHandler::delete),
        )
        .route("/api/v1/organisation/:organisation_id/role", get(OrganisationHandler::get_user_role))
        .route(
            "/api/v1/organisation/slug/:slug",
            get(OrganisationHandler::get_by_slug),
        )
        .route(
            "/api/v1/organisation/:organisation_id/campaign",
            post(OrganisationHandler::create_campaign),
        )
        .route(
            "/api/v1/organisation/:organisation_id/campaign/slug_check",
            post(OrganisationHandler::check_campaign_slug_availability),
        )
        .route(
            "/api/v1/organisation/:organisation_id/campaigns",
            get(OrganisationHandler::get_campaigns),
        )
        .route(
            "/api/v1/organisation/:organisation_id/email_template",
            post(OrganisationHandler::create_email_template),
        )
        .route(
            "/api/v1/organisation/:organisation_id/email_templates",
            get(OrganisationHandler::get_all_email_templates),
        )
        .route(
            "/api/v1/organisation/:organisation_id/logo",
            patch(OrganisationHandler::update_logo),
        )
        .route(
            "/api/v1/organisation/:organisation_id/members",
            get(OrganisationHandler::get_members)
                .put(OrganisationHandler::update_members)
        )
        .route(
            "/api/v1/organisation/:organisation_id/user",
            post(OrganisationHandler::invite_user).delete(OrganisationHandler::remove_user),
        )
        .route(
            "/api/v1/organisation/:organisation_id/admins",
            get(OrganisationHandler::get_admins)
                .put(OrganisationHandler::update_admins)
        )
        .route(
            "/api/v1/organisation/:organisation_id/admin",
                delete(OrganisationHandler::remove_admin),
        )
        .route(
            "/api/v1/organisation/:organisation_id/users",
            get(OrganisationHandler::get_users)
        )
        .route(
            "/api/v1/rating/:rating_id",
            get(RatingHandler::get)
                .delete(RatingHandler::delete)
                .put(RatingHandler::update),
        )
        .route(
            "/api/v1/campaign/:campaign_id/role",
            post(CampaignHandler::create_role),
        )
        .route(
            "/api/v1/campaign/:campaign_id/role/:role_id/questions",
            get(QuestionHandler::get_all_by_campaign_and_role),
        )
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
                .patch(RoleHandler::update)
                .delete(RoleHandler::delete),
        )
        .route(
            "/api/v1/role/:role_id/applications",
            get(RoleHandler::get_applications),
        )
        .route(
            "/api/v1/campaign/:campaign_id",
            get(CampaignHandler::get)
                .put(CampaignHandler::update)
                .delete(CampaignHandler::delete),
        )
        .route(
            "/api/v1/campaign/:campaign_id/publish",
            patch(CampaignHandler::publish),
        )
        .route(
            "/api/v1/organisation/slug/:organisation_slug/campaign/slug/:campaign_slug",
            get(CampaignHandler::get_by_slugs),
        )
        .route("/api/v1/campaigns", get(CampaignHandler::get_all))
        .route(
            "/api/v1/campaign/:campaign_id/apply",
            post(ApplicationHandler::create_or_get),
        )
        .route(
            "/api/v1/campaign/:campaign_id/application/exists",
            get(ApplicationHandler::check_application_exists),
        )
        .route(
            "/api/v1/campaign/:campaign_id/question",
            post(QuestionHandler::create),
        )
        .route(
            "/api/v1/campaign/:campaign_id/question/:id",
            patch(QuestionHandler::update).delete(QuestionHandler::delete),
        )
        .route(
            "/api/v1/campaign/:campaign_id/questions/common",
            get(QuestionHandler::get_all_common_by_campaign),
        )
        .route(
            "/api/v1/campaign/:campaign_id/banner",
            patch(CampaignHandler::update_banner),
        )
        .route(
            "/api/v1/campaign/:campaign_id/attachments",
            get(CampaignHandler::get_attachments)
                .patch(CampaignHandler::upload_attachments),
        )
        .route(
            "/api/v1/campaign/attachment/:attachment_id",
            delete(CampaignHandler::delete_attachment),
        )
        .route(
            "/api/v1/campaign/:campaign_id/application",
            post(CampaignHandler::create_application),
        )
        .route(
            "/api/v1/campaign/:campaign_id/offer",
            post(CampaignHandler::create_offer),
        )
        .route(
            "/api/v1/campaign/:campaign_id/offers",
            get(CampaignHandler::get_offers),
        )
        .route(
            "/api/v1/application/:application_id",
            get(ApplicationHandler::get),
        )
        .route(
            "/api/v1/application/:application_id/inprogress",
            get(ApplicationHandler::get_in_progress),
        )
        .route(
            "/api/v1/application/:application_id/rating",
            get(ApplicationHandler::get_rating_by_current_user)
                .post(ApplicationHandler::create_rating)
                .put(ApplicationHandler::update_rating),
        )
        .route(
            "/api/v1/application/:application_id/ratings",
            get(ApplicationHandler::get_ratings),
        )
        .route(
            "/api/v1/application/:application_id/status",
            patch(ApplicationHandler::set_status),
        )
        .route(
            "/api/v1/application/:application_id/private",
            patch(ApplicationHandler::set_private_status),
        )
        .route(
            "/api/v1/application/:application_id/answers/common",
            get(AnswerHandler::get_all_common_by_application),
        )
        .route(
            "/api/v1/application/:application_id/answer",
            post(AnswerHandler::create),
        )
        .route(
            "/api/v1/application/:application_id/role/:role_id/answers",
            get(AnswerHandler::get_all_by_application_and_role),
        )
        .route(
            "/api/v1/application/:application_id/roles",
            get(ApplicationHandler::get_roles).patch(ApplicationHandler::update_roles)
        )
        .route(
            "/api/v1/application/:application_id/submit",
            post(ApplicationHandler::submit)
        )
        .route(
            "/api/v1/answer/:answer_id",
            patch(AnswerHandler::update).delete(AnswerHandler::delete),
        )
        .route(
            "/api/v1/email_template/:template_id",
            get(EmailTemplateHandler::get)
                .patch(EmailTemplateHandler::update)
                .delete(EmailTemplateHandler::delete),
        )
        .route(
            "/api/v1/email_template/:template_id/duplicate",
            post(EmailTemplateHandler::duplicate)
        )
        .route(
            "/api/v1/offer/:offer_id",
            get(OfferHandler::get)
                .delete(OfferHandler::delete)
                .post(OfferHandler::reply),
        )
        .route(
            "/api/v1/offer/:offer_id/preview",
            get(OfferHandler::preview_email),
        )
        .route(
            "/api/v1/offer/:offer_id/send",
            post(OfferHandler::send_offer),
        )

        // Invite routes
        // - GET  /api/v1/invite/:code  -> invite details
        // - POST /api/v1/invite/:code  -> accept invite
        .route(
            "/api/v1/invite/:code", get(InviteHandler::get).post(InviteHandler::use_invite)
        )

        

        
        .layer(cors)
        .with_state(state))
}
