//! Answer service for the Chaos application.
//! 
//! This module provides functionality for managing application answers, including:
//! - Verifying answer ownership
//! - Checking if answers can be modified based on application status

use chrono::Utc;
use crate::models::error::ChaosError;
use sqlx::{Pool, Postgres};

/// Verifies if a user is the owner of an answer.
/// 
/// This function checks if the user owns the application that contains the answer.
/// 
/// # Arguments
/// 
/// * `user_id` - The ID of the user to check
/// * `answer_id` - The ID of the answer
/// * `pool` - Database connection pool
/// 
/// # Returns
/// 
/// * `Result<(), ChaosError>` - Ok if the user is the owner, Unauthorized error otherwise
pub async fn user_is_answer_owner(
    user_id: i64,
    answer_id: i64,
    pool: &Pool<Postgres>,
) -> Result<(), ChaosError> {
    let is_owner = sqlx::query!(
        "
            SELECT EXISTS(
                SELECT 1 FROM (
                    SELECT FROM answers ans
                     JOIN applications app ON ans.application_id = app.id
                     WHERE ans.id = $1 AND app.user_id = $2
                )
            )
        ",
        answer_id,
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

/// Verifies if an answer can be modified.
/// 
/// This function checks if the application containing the answer has not been submitted
/// and if the campaign deadline has not passed.
/// 
/// # Arguments
/// 
/// * `answer_id` - The ID of the answer to check
/// * `pool` - Database connection pool
/// 
/// # Returns
/// 
/// * `Result<(), ChaosError>` - Ok if the answer can be modified, ApplicationClosed error otherwise
pub async fn assert_answer_application_is_open(
    answer_id: i64,
    pool: &Pool<Postgres>,
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
        .fetch_one(pool)
        .await?;

    if application.submitted || application.ends_at <= time {
        return Err(ChaosError::ApplicationClosed)
    }

    Ok(())
}