//! Answer service for the Chaos application.
//!
//! This module provides functionality for managing application answers, including:
//! - Checking if answers can be modified based on application status

use crate::models::error::ChaosError;
use chrono::Utc;
use sqlx::{Postgres, Transaction};
use std::ops::DerefMut;

/// Verifies if an answer can be modified.
///
/// This function checks if the application containing the answer has not been submitted
/// and if the campaign deadline has not passed.
///
/// # Arguments
///
/// * `answer_id` - The ID of the answer to check
/// * `transaction` - Database transaction
///
/// # Returns
///
/// * `Result<(), ChaosError>` - Ok if the answer can be modified, ApplicationClosed error otherwise
pub async fn assert_answer_application_is_open(
    answer_id: i64,
    transaction: &mut Transaction<'_, Postgres>,
) -> Result<(), ChaosError> {
    let time = Utc::now();
    let application = sqlx::query!(
        "
            SELECT app.submitted, c.ends_at FROM answers ans
            JOIN applications app ON app.id = ans.application_id
            JOIN campaigns c on c.id = app.campaign_id
            WHERE ans.id = $1
        ",
        answer_id
    )
    .fetch_one(transaction.deref_mut())
    .await?;

    if application.submitted || application.ends_at <= time {
        return Err(ChaosError::ApplicationClosed);
    }

    Ok(())
}
