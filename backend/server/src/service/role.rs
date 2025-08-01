//! Role service for the Chaos application.
//! 
//! This module provides functionality for managing campaign roles, including:
//! - Verifying role admin privileges

use std::ops::DerefMut;
use crate::models::error::ChaosError;
use sqlx::{Pool, Postgres, Transaction};

/// Verifies if a user has admin privileges for a role.
/// 
/// This function checks if the user is an admin of the organisation that owns the campaign
/// the role belongs to.
/// 
/// # Arguments
/// 
/// * `user_id` - The ID of the user to check
/// * `role_id` - The ID of the role
/// * `pool` - Database connection pool
/// 
/// # Returns
/// 
/// * `Result<(), ChaosError>` - Ok if the user is an admin, Unauthorized error otherwise
pub async fn user_is_role_admin(
    user_id: i64,
    role_id: i64,
    transaction: &mut Transaction<'_, Postgres>,
) -> Result<(), ChaosError> {
    let is_admin = sqlx::query!(
        "
            SELECT EXISTS(
                SELECT 1 FROM (
                    SELECT c.organisation_id FROM campaign_roles r
                    JOIN campaigns c on r.campaign_id = c.id
                    WHERE r.id = $1
                ) cr
                JOIN organisation_members m on cr.organisation_id = m.organisation_id
                WHERE m.user_id = $2 AND m.role = 'Admin'
            )
        ",
        role_id,
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
