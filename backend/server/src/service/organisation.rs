use crate::models::error::ChaosError;
use sqlx::{Pool, Postgres};

pub async fn user_is_organisation_admin(
    user_id: i64,
    organisation_id: i64,
    pool: &Pool<Postgres>,
) -> Result<(), ChaosError> {
    let is_admin = sqlx::query!(
        "SELECT EXISTS(SELECT 1 FROM organisation_members WHERE organisation_id = $1 AND user_id = $2 AND role = 'Admin')",
        organisation_id,
        user_id
    )
        .fetch_one(pool)
        .await?.exists.expect("`exists` should always exist in this query result");

    if !is_admin {
        return Err(ChaosError::Unauthorized);
    }

    Ok(())
}