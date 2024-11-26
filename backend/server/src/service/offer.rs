use crate::models::error::ChaosError;
use sqlx::{Pool, Postgres};
use crate::models::offer::Offer;

pub async fn assert_user_is_offer_admin(
    user_id: i64,
    offer_id: i64,
    pool: &Pool<Postgres>,
) -> Result<(), ChaosError> {
    let is_admin = sqlx::query!(
        "
            SELECT EXISTS(
                SELECT 1 FROM offers off
                JOIN campaigns c ON c.id = off.campaign_id
                JOIN organisation_members m on c.organisation_id = m.organisation_id
                WHERE off.id = $1 AND m.user_id = $2 AND m.role = 'Admin'
            )
        ",
        offer_id,
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

pub async fn assert_user_is_offer_recipient(
    user_id: i64,
    offer_id: i64,
    pool: &Pool<Postgres>,
) -> Result<(), ChaosError> {
    let tx = &mut pool.begin().await?;
    let offer = Offer::get(offer_id, tx).await?;

    if offer.user_id != user_id {
        return Err(ChaosError::Unauthorized)
    }

    Ok(())
}