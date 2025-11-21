//! Organisation service for the Chaos application.
//! 
//! This module provides functionality for managing organisations, including:
//! - Verifying organisation admin privileges

use crate::models::error::ChaosError;
use sqlx::{Pool, Postgres, Transaction};
use crate::models::user::UserRole;
use std::ops::DerefMut;

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
    transaction: &mut Transaction<'_, Postgres>,
) -> Result<(), ChaosError> {
    let is_admin = sqlx::query!(
        "SELECT EXISTS(SELECT 1 FROM organisation_members WHERE organisation_id = $1 AND user_id = $2 AND role = 'Admin')",
        organisation_id,
        user_id
    )
        .fetch_one(transaction.deref_mut())
        .await?.exists.expect("`exists` should always exist in this query result");

    if !is_admin {
        return Err(ChaosError::Unauthorized);
    }

    Ok(())
}

/// Verifies if a user is in an organization
/// 
/// This function checks if the user is a member of the specified organisation.
/// 
/// # Arguments
/// 
/// * `user_id` - The ID of the user to check
/// * `organisation_id` - The ID of the organisation
/// * `pool` - Database connection pool
/// 
/// # Returns
/// 
/// * `Result<(), ChaosError>` - Ok if the user is a member, Unauthorized error otherwise
pub async fn assert_user_is_not_in_organisation(
    user_id: i64,
    organisation_id: i64,
    transaction: &mut Transaction<'_, Postgres>,
) -> Result<(), ChaosError> {
    let in_organization = sqlx::query!(
        "SELECT EXISTS(SELECT 1 FROM organisation_members WHERE organisation_id = $1 AND user_id = $2)",
        organisation_id,
        user_id
    )
        .fetch_one(transaction.deref_mut())
        .await?.exists.expect("`exists` should always exist in this query result");

    if in_organization{
        return Err(ChaosError::Unauthorized);
    }

    Ok(())
}

/// Verifies if a user has admin privileges for an organisation or is a super user.
/// 
/// This function checks if the user is an admin member of the specified organisation or is a super user.
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
pub async fn assert_user_is_organisation_admin_or_super_user(
    user_id: i64,
    organisation_id: i64,
    transaction: &mut Transaction<'_, Postgres>,
) -> Result<(), ChaosError> {
    let is_admin = sqlx::query!(
        "SELECT EXISTS(SELECT 1 FROM organisation_members WHERE organisation_id = $1 AND user_id = $2 AND role = 'Admin')",
        organisation_id,
        user_id
    )
        .fetch_one(transaction.deref_mut())
        .await?.exists.expect("`exists` should always exist in this query result");

    let is_super_user = sqlx::query!(
        "SELECT EXISTS(SELECT 1 FROM users WHERE id = $1 AND role = $2)",
        user_id,
        UserRole::SuperUser as UserRole
    )
    .fetch_one(transaction.deref_mut())
    .await?
    .exists
    .expect("`exists` should always exist in this query result");

    if !is_admin && !is_super_user{
        return Err(ChaosError::Unauthorized);
    }

    Ok(())
}


