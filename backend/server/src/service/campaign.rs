//! Campaign service for the Chaos application.
//! 
//! This module provides functionality for managing campaigns, including:
//! - Verifying campaign admin privileges
//! - Checking campaign status and deadlines

use chrono::Utc;
use crate::models::error::ChaosError;
use sqlx::{Pool, Postgres};

/// Verifies if a user has admin privileges for a campaign.
/// 
/// This function checks if the user is an admin of the organisation that owns the campaign.
/// 
/// # Arguments
/// 
/// * `user_id` - The ID of the user to check
/// * `campaign_id` - The ID of the campaign
/// * `pool` - Database connection pool
/// 
/// # Returns
/// 
/// * `Result<(), ChaosError>` - Ok if the user is an admin, Unauthorized error otherwise
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
                WHERE c.id = $1 AND m.user_id = $2 AND m.role = 'Admin'
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

/// Verifies if a campaign is still open for applications.
/// 
/// This function checks if the campaign deadline has not passed.
/// 
/// # Arguments
/// 
/// * `campaign_id` - The ID of the campaign to check
/// * `pool` - Database connection pool
/// 
/// # Returns
/// 
/// * `Result<(), ChaosError>` - Ok if the campaign is open, CampaignClosed error otherwise
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