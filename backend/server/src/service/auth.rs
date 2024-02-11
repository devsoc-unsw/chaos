use anyhow::Result;
use jsonwebtoken::{DecodingKey, EncodingKey};
use sqlx::{Pool, Postgres};

/// Checks if a user exists in DB based on given email address. If so, their user_id is returned.
/// Otherwise, a new user is created in the DB, and the new id is returned.
/// This function is used in OAuth flows to login/signup users when they click the
/// "Sign in with ___" buttons. The returned user_id will be used to generate a JWT to be
/// used as a token for the user's browser.
pub async fn create_or_get_user_id(email: String, pool: Pool<Postgres>) -> Result<i64> {
    // TODO: See if user (by email) exists in the database and return their id. If not, insert them, and return the new id.

    let user_id = 1;
    return Ok(user_id);
}

pub async fn is_super_user(user_id: i64, pool: &Pool<Postgres>) -> Result<bool> {
    let is_super_user = sqlx::query!("SELECT EXISTS(SELECT 1 FROM users WHERE id = $1 AND role = $2)", user_id, UserRole::SuperUser)
        .fetch_one(pool)
        .await?;

    Ok(is_super_user.exists.unwrap())
}
