use crate::models::app::AppState;
use crate::models::error::ChaosError;
use crate::models::user::UserRole;
use crate::service::jwt::decode_auth_token;
use axum::http::request::Parts;
use axum::RequestPartsExt;
use axum_extra::headers::Cookie;
use axum_extra::TypedHeader;
use snowflake::SnowflakeIdGenerator;
use sqlx::{Pool, Postgres};

/// Checks if a user exists in DB based on given email address. If so, their user_id is returned.
/// Otherwise, a new user is created in the DB, and the new id is returned.
/// This function is used in OAuth flows to login/signup users when they click the
/// "Sign in with ___" buttons. The returned user_id will be used to generate a JWT to be
/// used as a token for the user's browser.
pub async fn create_or_get_user_id(
    email: String,
    name: String,
    pool: Pool<Postgres>,
    mut snowflake_generator: SnowflakeIdGenerator,
) -> Result<i64, ChaosError> {
    let possible_user_id = sqlx::query!(
        "SELECT id FROM users WHERE lower(email) = $1",
        email.to_lowercase()
    )
    .fetch_optional(&pool)
    .await?;

    if let Some(result) = possible_user_id {
        return Ok(result.id);
    }

    let user_id = snowflake_generator.real_time_generate();

    sqlx::query!(
        "INSERT INTO users (id, email, name) VALUES ($1, $2, $3)",
        user_id,
        email.to_lowercase(),
        name
    )
    .execute(&pool)
    .await?;

    Ok(user_id)
}

pub async fn assert_is_super_user(user_id: i64, pool: &Pool<Postgres>) -> Result<(), ChaosError> {
    let is_super_user = sqlx::query!(
        "SELECT EXISTS(SELECT 1 FROM users WHERE id = $1 AND role = $2)",
        user_id,
        UserRole::SuperUser as UserRole
    )
    .fetch_one(pool)
    .await?
    .exists
    .expect("`exists` should always exist in this query result");

    if !is_super_user {
        return Err(ChaosError::Unauthorized);
    }

    Ok(())
}

pub async fn extract_user_id_from_request(
    parts: &mut Parts,
    state: &AppState,
) -> Result<i64, ChaosError> {
    let decoding_key = &state.decoding_key;
    let jwt_validator = &state.jwt_validator;
    
    println!("Attempting to extract user ID from request...");
    
    let TypedHeader(cookies) = parts
        .extract::<TypedHeader<Cookie>>()
        .await
        .map_err(|e| {
            eprintln!("Failed to extract cookies: {:?}", e);
            ChaosError::NotLoggedIn
        })?;

    println!("Cookies extracted: {:?}", cookies);

    let token = cookies.get("auth_token").ok_or_else(|| {
        eprintln!("No auth_token cookie found");
        ChaosError::NotLoggedIn
    })?;

    println!("Found auth_token cookie: {}", token);

    let claims =
        decode_auth_token(token, decoding_key, jwt_validator).ok_or_else(|| {
            eprintln!("Failed to decode auth token");
            ChaosError::NotLoggedIn
        })?;

    println!("Successfully decoded token for user ID: {}", claims.sub);
    Ok(claims.sub)
}
