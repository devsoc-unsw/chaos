use crate::models::error::ChaosError;
use sqlx::{Pool, Postgres};

pub async fn user_is_application_admin(
    user_id: i64,
    application_id: i64,
    pool: &Pool<Postgres>,
) -> Result<(), ChaosError> {
    let is_admin = sqlx::query!(
        "
            SELECT EXISTS(
                SELECT 1 FROM (
                    SELECT c.organisation_id FROM applications a
                    JOIN campaigns c on a.campaign_id = c.id
                    WHERE a.id = $1
                ) ca
                JOIN organisation_members m on ca.organisation_id = m.organisation_id
                WHERE m.user_id = $2 AND m.role = 'Admin'
            )
        ",
        application_id,
        user_id
    )
    .fetch_one(pool)
    .await?
    .exists
    .expect("`exists` should always exist in this query result");

    if !is_admin {
        return Err(ChaosError::Unauthorized);
    }

    Ok(())
}

pub async fn user_is_application_owner(
    user_id: i64,
    application_id: i64,
    pool: &Pool<Postgres>,
) -> Result<(), ChaosError> {
    let is_owner = sqlx::query!(
        "
            SELECT EXISTS(
                SELECT 1 FROM (
                    SELECT FROM applications WHERE id = $1 AND user_id = $2
                ) sub
            )
        ",
        application_id,
        user_id
    )
    .fetch_one(pool)
    .await?
    .exists
    .expect("`exists` should always exist in this query result");

    if !is_owner {
        return Err(ChaosError::Unauthorized);
    }

    Ok(())
}
