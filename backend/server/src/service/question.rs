//! Question service for the Chaos application.
//! 
//! This module provides functionality for managing campaign questions, including:
//! - Verifying question admin privileges

use crate::models::error::ChaosError;
use sqlx::{Pool, Postgres};

/// Verifies if a user has admin privileges for a question.
/// 
/// This function checks if the user is an admin of the organisation that owns the campaign
/// the question belongs to.
/// 
/// # Arguments
/// 
/// * `user_id` - The ID of the user to check
/// * `question_id` - The ID of the question
/// * `pool` - Database connection pool
/// 
/// # Returns
/// 
/// * `Result<(), ChaosError>` - Ok if the user is an admin, Unauthorized error otherwise
pub async fn user_is_question_admin(
    user_id: i64,
    question_id: i64,
    pool: &Pool<Postgres>,
) -> Result<(), ChaosError> {
    let is_admin = sqlx::query!(
        "
            SELECT EXISTS(
                SELECT 1
                FROM questions q
                JOIN campaigns c on q.campaign_id = c.id
                JOIN organisation_members om on c.organisation_id = om.organisation_id
                WHERE q.id = $1 AND om.user_id = $2 AND om.role = 'Admin'
            )
        ",
        question_id,
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
