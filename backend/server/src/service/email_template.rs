use crate::models::error::ChaosError;
use sqlx::{Pool, Postgres};

pub async fn user_is_email_template_admin(
    user_id: i64,
    template_id: i64,
    pool: &Pool<Postgres>,
) -> Result<(), ChaosError> {
    let is_admin = sqlx::query!(
        "
            SELECT EXISTS(
                SELECT 1 FROM email_templates et
                JOIN organisation_members m on et.organisation_id = m.organisation_id
                WHERE et.id = $1 AND m.user_id = $2 AND m.role = 'Admin'
            )
        ",
        template_id,
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
