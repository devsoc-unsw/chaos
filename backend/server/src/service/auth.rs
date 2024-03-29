use crate::models::user::UserRole;
use anyhow::Result;
use jsonwebtoken::{DecodingKey, EncodingKey};
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
) -> Result<i64> {
    let possible_user_id = sqlx::query!("SELECT id FROM users WHERE email = $1", email)
        .fetch_optional(&pool)
        .await?;

    if let Some(result) = possible_user_id {
        return Ok(result.id);
    }

    let user_id = snowflake_generator.real_time_generate();

    let response = sqlx::query!(
        "INSERT INTO users (id, email, name) VALUES ($1, $2, $3)",
        user_id,
        email,
        name
    )
    .execute(&pool)
    .await?;

    Ok(user_id)
}

pub async fn is_super_user(user_id: i64, pool: &Pool<Postgres>) -> Result<bool> {
    let is_super_user = sqlx::query!(
        "SELECT EXISTS(SELECT 1 FROM users WHERE id = $1 AND role = $2)",
        user_id,
        UserRole::SuperUser as UserRole
    )
    .fetch_one(pool)
    .await?;

    Ok(is_super_user.exists.unwrap())
}
