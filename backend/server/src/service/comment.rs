//! Comment service for the Chaos application.
//!
//! This module provides functionality for managing comments, including:
//! - Verifying comment owner
use crate::models::error::ChaosError;
use sqlx::{Postgres, Transaction};
use std::ops::DerefMut;

/// Verifies if a user has owner privileges for a comment
///
/// This function checks if the user is the author of a comment and can thus edit/delete it
///
/// # Arguments
///
/// * `user_id` - The ID of the user to check
/// * `comment_id` - The ID of the comment
/// * `pool` - Database connection pool
///
/// # Returns
///
/// * `Result<(), ChaosError>` - Ok if the user is an admin, Unauthorized error otherwise
pub async fn user_is_comment_author(
    user_id: i64,
    comment_id: i64,
    transaction: &mut Transaction<'_, Postgres>,
) -> Result<bool, ChaosError> {
    let is_author = sqlx::query!(
        "
            SELECT EXISTS(
                SELECT 1 FROM (
                    SELECT u.id FROM users u
                    JOIN comments c on c.author_id = $1
                    WHERE c.id = $2
                )
            )
        ",
        user_id,
        comment_id
    )
    .fetch_one(transaction.deref_mut())
    .await?
    .exists
    .expect("`exists` should always exist in this query result");

    if !is_author {
        return Ok(false);
    }

    Ok(true)
}
