use chrono::Utc;
use crate::models::error::ChaosError;
use sqlx::{Pool, Postgres};

pub async fn user_is_campaign_admin(
    user_id: i64,
    campaign_id: i64,
    pool: &Pool<Postgres>,
) -> Result<(), ChaosError> {
    let is_admin = sqlx::query!(
        "
            SELECT EXISTS(
                SELECT 1 FROM campaigns c
                JOIN organisation_members m on c.organisation_id = m.organisation_id
                WHERE c.organisation_id = $1 AND m.user_id = $2 AND m.role = 'Admin'
            )
        ",
        campaign_id,
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

pub async fn assert_campaign_is_open(
    campaign_id: i64,
    pool: &Pool<Postgres>,
) -> Result<(), ChaosError> {
    let time = Utc::now();
    let campaign = sqlx::query!(
        "
            SELECT ends_at FROM campaigns WHERE id = $1
        ",
        campaign_id
    )
        .fetch_one(pool)
        .await?;

    if campaign.ends_at <= time {
        return Err(ChaosError::CampaignClosed)
    }

    Ok(())
}