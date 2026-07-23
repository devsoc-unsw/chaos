//! Shared test-support harness for handler integration tests.
//!
//! Handlers are thin async pass-throughs (extractor → model → response), so the
//! only meaningful test is an HTTP-level one that drives the real axum router
//! against a real Postgres (`#[sqlx::test]`) with a signed JWT cookie. This
//! module centralises the pieces every handler test needs:
//!
//!   · `test_state` – an `AppState` wired to the test DB, with S3/OAuth/SMTP
//!     stubbed with inert values (handlers that never touch them don't care).
//!   · `auth_cookie` / `request` – build requests that authenticate as a user.
//!   · `body_json` – read a JSON response body.
//!   · `seed_*` – deterministic fixed-id rows for the common entity graph
//!     (user → organisation → campaign → role → application → question).
//!
//! Only compiled under `cfg(test)`.

use crate::models::app::AppState;
use crate::service::jwt::encode_auth_token;
use axum::body::{to_bytes, Body};
use axum::http::{header, Request};
use jsonwebtoken::{Algorithm, DecodingKey, EncodingKey, Header, Validation};
use snowflake::SnowflakeIdGenerator;
use sqlx::PgPool;

/// Symmetric secret used to both mint and validate JWTs in tests.
pub const JWT_SECRET: &str = "test-secret-for-handler-integration";

// ── AppState / router wiring ──────────────────────────────────────────────

/// Builds an `AppState` bound to the given test pool. S3, OAuth and SMTP are
/// stubbed with inert values; handlers that actually use them must be tested
/// with a functional stub instead.
pub fn test_state(pool: PgPool) -> AppState {
    std::env::set_var("GOOGLE_REDIRECT_URI", "http://localhost");

    let mut jwt_validator = Validation::new(Algorithm::HS512);
    jwt_validator.set_issuer(&["Chaos"]);
    jwt_validator.set_audience(&["chaos.devsoc.app"]);

    let storage_bucket = s3::Bucket::new(
        "test",
        s3::Region::Custom {
            region: "".to_string(),
            endpoint: "http://localhost:9000".to_string(),
        },
        s3::creds::Credentials::new(Some("test"), Some("test"), None, None, None).unwrap(),
    )
    .unwrap();

    AppState {
        db: pool,
        ctx: reqwest::Client::new(),
        oauth2_client: crate::service::oauth2::build_oauth_client(
            "id".to_string(),
            "secret".to_string(),
        ),
        encoding_key: EncodingKey::from_secret(JWT_SECRET.as_bytes()),
        decoding_key: DecodingKey::from_secret(JWT_SECRET.as_bytes()),
        jwt_header: Header::new(Algorithm::HS512),
        jwt_validator,
        snowflake_generator: SnowflakeIdGenerator::new(1, 1),
        storage_bucket,
        is_dev_env: true,
        email_credentials: crate::models::email::EmailCredentials {
            credentials: lettre::transport::smtp::authentication::Credentials::new(
                "u".to_string(),
                "p".to_string(),
            ),
            email_from: "test@test.com".to_string(),
            email_host: "localhost".to_string(),
            email_host_port: 25,
        },
    }
}

// ── request helpers ───────────────────────────────────────────────────────

/// A signed `auth_token` cookie value for `user_id`, matching [`JWT_SECRET`].
pub fn auth_cookie(user_id: i64) -> String {
    let token = encode_auth_token(
        "tester".to_string(),
        user_id,
        &EncodingKey::from_secret(JWT_SECRET.as_bytes()),
        &Header::new(Algorithm::HS512),
    );
    format!("auth_token={token}")
}

/// Builds a request. `auth` = `Some(user_id)` attaches a signed cookie; `body`
/// = `Some(json)` sets a JSON body and content-type.
pub fn request(
    method: &str,
    uri: &str,
    auth: Option<i64>,
    body: Option<serde_json::Value>,
) -> Request<Body> {
    let mut builder = Request::builder().method(method).uri(uri);
    if let Some(user_id) = auth {
        builder = builder.header(header::COOKIE, auth_cookie(user_id));
    }
    match body {
        Some(value) => builder
            .header(header::CONTENT_TYPE, "application/json")
            .body(Body::from(serde_json::to_vec(&value).unwrap()))
            .unwrap(),
        None => builder.body(Body::empty()).unwrap(),
    }
}

/// Reads a response body as JSON.
pub async fn body_json(response: axum::response::Response) -> serde_json::Value {
    let bytes = to_bytes(response.into_body(), usize::MAX).await.unwrap();
    serde_json::from_slice(&bytes).unwrap()
}

// ── seed helpers (fixed ids, deterministic) ───────────────────────────────

/// Inserts a plain user with the given id.
pub async fn seed_user(pool: &PgPool, id: i64, email: &str) {
    sqlx::query("INSERT INTO users (id, email, name) VALUES ($1, $2, $3)")
        .bind(id)
        .bind(email)
        .bind("Test User")
        .execute(pool)
        .await
        .unwrap();
}

/// Inserts a super user with the given id.
pub async fn seed_super_user(pool: &PgPool, id: i64, email: &str) {
    sqlx::query("INSERT INTO users (id, email, name, role) VALUES ($1, $2, $3, 'SuperUser')")
        .bind(id)
        .bind(email)
        .bind("Super User")
        .execute(pool)
        .await
        .unwrap();
}

/// Inserts an organisation with the given id.
pub async fn seed_org(pool: &PgPool, id: i64, slug: &str) {
    sqlx::query(
        "INSERT INTO organisations (id, slug, name, contact_email)
         VALUES ($1, $2, $3, 'contact@test.com')",
    )
    .bind(id)
    .bind(slug)
    .bind("Test Org")
    .execute(pool)
    .await
    .unwrap();
}

/// Adds `user_id` to `org_id` with the given role (`'Admin'` or `'User'`).
pub async fn seed_org_member(pool: &PgPool, org_id: i64, user_id: i64, role: &str) {
    sqlx::query(
        "INSERT INTO organisation_members (organisation_id, user_id, role)
         VALUES ($1, $2, $3::organisation_role)",
    )
    .bind(org_id)
    .bind(user_id)
    .bind(role)
    .execute(pool)
    .await
    .unwrap();
}

/// Inserts a campaign. `open` = published + application window spanning now.
pub async fn seed_campaign(pool: &PgPool, id: i64, org_id: i64, open: bool) {
    let (starts, ends) = if open {
        ("NOW() - INTERVAL '1 day'", "NOW() + INTERVAL '1 day'")
    } else {
        ("NOW() - INTERVAL '2 day'", "NOW() - INTERVAL '1 day'")
    };
    sqlx::query(&format!(
        "INSERT INTO campaigns (id, organisation_id, slug, name, starts_at, ends_at, published)
         VALUES ($1, $2, $3, 'Camp', {starts}, {ends}, $4)"
    ))
    .bind(id)
    .bind(org_id)
    .bind(format!("camp-{id}"))
    .bind(open)
    .execute(pool)
    .await
    .unwrap();
}

/// Inserts a campaign role with the given id.
pub async fn seed_role(pool: &PgPool, id: i64, campaign_id: i64) {
    sqlx::query(
        "INSERT INTO campaign_roles (id, campaign_id, name, min_available, max_available, finalised)
         VALUES ($1, $2, 'Role', 1, 5, false)",
    )
    .bind(id)
    .bind(campaign_id)
    .execute(pool)
    .await
    .unwrap();
}

/// Inserts an application owned by `user_id` for `campaign_id`.
pub async fn seed_application(pool: &PgPool, id: i64, campaign_id: i64, user_id: i64) {
    sqlx::query("INSERT INTO applications (id, campaign_id, user_id) VALUES ($1, $2, $3)")
        .bind(id)
        .bind(campaign_id)
        .bind(user_id)
        .execute(pool)
        .await
        .unwrap();
}

/// Inserts a question. `qtype` is a `question_type` enum name.
pub async fn seed_question(
    pool: &PgPool,
    id: i64,
    campaign_id: i64,
    common: bool,
    qtype: &str,
) {
    sqlx::query(
        "INSERT INTO questions (id, title, common, required, question_type, campaign_id)
         VALUES ($1, 'Q', $2, true, $3::question_type, $4)",
    )
    .bind(id)
    .bind(common)
    .bind(qtype)
    .bind(campaign_id)
    .execute(pool)
    .await
    .unwrap();
}

/// Convenience: a user (id 1) who owns an open campaign's application.
///
/// Builds user 1 → org 1 → open campaign 1 → role 1 → application 1 (owned by
/// user 1). Returns nothing; all ids are fixed at 1.
pub async fn seed_owned_application(pool: &PgPool) {
    seed_user(pool, 1, "owner@test.com").await;
    seed_org(pool, 1, "org").await;
    seed_campaign(pool, 1, 1, true).await;
    seed_role(pool, 1, 1).await;
    seed_application(pool, 1, 1, 1).await;
}
