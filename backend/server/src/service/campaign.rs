//! Campaign service for the Chaos application.
//!
//! This module provides functionality for managing campaigns, including:
//! - Verifying campaign admin privileges
//! - Checking campaign status and deadlines

use crate::models::error::ChaosError;
use crate::spicedb;
use crate::spicedb::authzed::api::v1::permissions_service_client::PermissionsServiceClient;
use chrono::Utc;
use sqlx::{Pool, Postgres, Transaction};
use std::ops::DerefMut;
use tonic::transport::Channel;

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
        return Err(ChaosError::CampaignClosed);
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

/// Deletes a campaign and its child resources'
/// SpiceDB relationships. Some of these deletes are
/// handled by other resource/subject deletions -
/// the deletion call that handles them is
/// indicated below. The child resources and
/// their relationships that are deleted by
/// this function:
/// - campaign_role
///     - campaign_role->campaign - CAMPAIGN
/// - application
///     - application->campaign - CAMPAIGN
///     - application->creator - APPLICATION
/// - rating
///     - rating->application - APPLICATION
///     - rating->creator - RATING
/// - comment
///     - comment->application - APPLICATION
///     - comment->creator - COMMENT
/// - question
///     - question->campaign - CAMPAIGN
/// - rating_category
///     - rating_category->campaign - CAMPAIGN
/// - category_rating
///     - category_rating->rating - RATING
/// - answer
///     - answer->application - APPLICATION
/// - offer
///     - offer->campaign - CAMPAIGN
///     - offer->application - APPLICATION
pub async fn campaign_spicedb_deep_delete(
    campaign_id: i64,
    application_ids: Vec<i64>,
    rating_ids: Vec<i64>,
    comment_ids: Vec<i64>,
    spicedb_client: &PermissionsServiceClient<Channel>,
    spicedb_key: &str,
) -> Result<(), ChaosError> {
    // DELETE parent campaign
    spicedb::delete_all_resource_relationships(
        spicedb_client,
        spicedb_key,
        crate::spicedb::schema::resource::CAMPAIGN,
        campaign_id,
    )
    .await?;

    // DELETE applications
    for application_id in application_ids {
        spicedb::delete_all_resource_relationships(
            spicedb_client,
            spicedb_key,
            crate::spicedb::schema::resource::APPLICATION,
            application_id,
        )
        .await?;
    }

    // DELETE ratings
    for rating_id in rating_ids {
        spicedb::delete_all_resource_relationships(
            spicedb_client,
            spicedb_key,
            crate::spicedb::schema::resource::RATING,
            rating_id,
        )
        .await?;
    }

    // DELETE comments
    for comment_id in comment_ids {
        spicedb::delete_all_resource_relationships(
            spicedb_client,
            spicedb_key,
            crate::spicedb::schema::resource::COMMENT,
            comment_id,
        )
        .await?;
    }

    Ok(())
}
