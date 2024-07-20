use crate::models::error::ChaosError;
use sqlx::{Pool, Postgres};

pub async fn user_is_role_admin(
    user_id: i64,
    role_id: i64,
    pool: &Pool<Postgres>,
) -> Result<(), ChaosError> {
    let is_admin = sqlx::query!(
        "
            SELECT EXISTS(
                SELECT 1 FROM (
                    SELECT c.organisation_id FROM campaign_roles r
                    JOIN campaigns c on r.campaign_id = c.id
                    WHERE r.id = $1
                ) cr
                JOIN organisation_members m on cr.organisation_id = m.organisation_id
                WHERE m.user_id = $2 AND m.role = 'Admin'
            )
        ",
        role_id,
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