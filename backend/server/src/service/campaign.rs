//! Campaign service for the Chaos application.
//! 
//! This module provides functionality for managing campaigns, including:
//! - Verifying campaign admin privileges
//! - Checking campaign status and deadlines

use chrono::Utc;
use crate::models::error::ChaosError;
use sqlx::{Postgres, Transaction};
use std::ops::DerefMut;

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
    transaction: &mut Transaction<'_, Postgres>,
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
    .fetch_one(transaction.deref_mut())
    .await?
    .exists
    .expect("`exists` should always exist in this query result");

    if !is_admin {
        return Err(ChaosError::Unauthorized);
    }

    Ok(())
}

pub async fn user_is_campaign_org_member(
    user_id: i64,
    campaign_id: i64,
    transaction: &mut Transaction<'_, Postgres>,
) -> Result<(), ChaosError> {
    let is_admin = sqlx::query!(
        "
            SELECT EXISTS(
                SELECT 1 FROM campaigns c
                JOIN organisation_members m on c.organisation_id = m.organisation_id
                WHERE c.id = $1 AND m.user_id = $2
            )
        ",
        campaign_id,
        user_id
    )
        .fetch_one(transaction.deref_mut())
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
    transaction: &mut Transaction<'_, Postgres>,
) -> Result<(), ChaosError> {
    let time = Utc::now();
    let campaign = sqlx::query!(
        "
            SELECT ends_at FROM campaigns WHERE id = $1
        ",
        campaign_id
    )
        .fetch_one(transaction.deref_mut())
        .await?;

    if campaign.ends_at <= time {
        return Err(ChaosError::CampaignClosed)
    }

    Ok(())
}

pub fn create_proper_slug(input: &str) -> String {
    let mut result = String::new();
    let mut last_char_was_hyphen = false; // To handle consecutive non-alphanumeric chars

    for c in input.chars() {
        if c.is_alphanumeric() {
            result.push(c);
            last_char_was_hyphen = false;
        } else {
            if !last_char_was_hyphen {
                result.push('-');
                last_char_was_hyphen = true;
            }
        }
    }

    // Remove leading and trailing hyphens if necessary (optional, depending on desired behavior)
    result.trim_matches('-').to_string().to_lowercase()
}