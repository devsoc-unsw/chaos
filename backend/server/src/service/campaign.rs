//! Campaign service for the Chaos application.
//!
//! This module provides functionality for managing campaigns, including:
//! - Verifying campaign is accepting applications
//! - Create a URL-friendly slug

use crate::models::error::ChaosError;
use chrono::Utc;
use sqlx::{Postgres, Transaction};
use std::ops::DerefMut;

/// Verifies if a campaign is still open for applications.
///
/// This function checks if the campaign deadline has not passed.
///
/// # Arguments
///
/// * `campaign_id` - The ID of the campaign to check
/// * `transaction` - Database transaction
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

/// Converts an input string into a URL-friendly slug.
///
/// This function replaces runs of non-alphanumeric characters with a single hyphen,
/// removes leading/trailing hyphens, and lowercases the result.
///
/// # Arguments
///
/// * `input` - The string to convert into a slug
///
/// # Returns
///
/// * `String` - The slugified string
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
