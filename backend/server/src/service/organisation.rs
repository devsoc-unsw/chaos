//! Organisation service for the Chaos application.
//! 
//! This module provides functionality for managing organisations, including:
//! - Verifying organisation admin privileges

use crate::models::error::ChaosError;
use sqlx::{Pool, Postgres};

/// Verifies if a user has admin privileges for an organisation.
/// 
/// This function checks if the user is an admin member of the specified organisation.
/// 
/// # Arguments
/// 
/// * `user_id` - The ID of the user to check
/// * `organisation_id` - The ID of the organisation
/// * `pool` - Database connection pool
/// 
/// # Returns
/// 
/// * `Result<(), ChaosError>` - Ok if the user is an admin, Unauthorized error otherwise
pub async fn assert_user_is_organisation_admin(
    user_id: i64,
    organisation_id: i64,
    pool: &Pool<Postgres>,
) -> Result<(), ChaosError> {
    let is_admin = sqlx::query!(
        "SELECT EXISTS(SELECT 1 FROM organisation_members WHERE organisation_id = $1 AND user_id = $2 AND role = 'Admin')",
        organisation_id,
        user_id
    )
        .fetch_one(pool)
        .await?.exists.expect("`exists` should always exist in this query result");

    if !is_admin {
        return Err(ChaosError::Unauthorized);
    }

    Ok(())
}
