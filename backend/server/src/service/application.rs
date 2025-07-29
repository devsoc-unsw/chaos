//! Application service for the Chaos application.
//! 
//! This module provides functionality for managing applications, including:
//! - Verifying application admin privileges
//! - Verifying application ownership
//! - Checking application status and deadlines

use chrono::Utc;
use crate::models::error::ChaosError;
use sqlx::{Pool, Postgres};

/// Verifies if a user has admin privileges for an application.
/// 
/// This function checks if the user is an admin of the organisation that owns the campaign
/// the application belongs to.
/// 
/// # Arguments
/// 
/// * `user_id` - The ID of the user to check
/// * `application_id` - The ID of the application
/// * `pool` - Database connection pool
/// 
/// # Returns
/// 
/// * `Result<(), ChaosError>` - Ok if the user is an admin, Unauthorized error otherwise
pub async fn user_is_application_admin(
    user_id: i64,
    application_id: i64,
    pool: &Pool<Postgres>,
) -> Result<(), ChaosError> {
    let is_admin = sqlx::query!(
        "
            SELECT EXISTS(
                SELECT 1 FROM (
                    SELECT c.organisation_id FROM applications a
                    JOIN campaigns c on a.campaign_id = c.id
                    WHERE a.id = $1
                ) ca
                JOIN organisation_members m on ca.organisation_id = m.organisation_id
                WHERE m.user_id = $2 AND m.role = 'Admin'
            )
        ",
        application_id,
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

/// Verifies if a user is the owner of an application.
/// 
/// This function checks if the user created the application.
/// 
/// # Arguments
/// 
/// * `user_id` - The ID of the user to check
/// * `application_id` - The ID of the application
/// * `pool` - Database connection pool
/// 
/// # Returns
/// 
/// * `Result<(), ChaosError>` - Ok if the user is the owner, Unauthorized error otherwise
pub async fn user_is_application_owner(
    user_id: i64,
    application_id: i64,
    pool: &Pool<Postgres>,
) -> Result<(), ChaosError> {
    let is_owner = sqlx::query!(
        "
            SELECT EXISTS(
                SELECT 1 FROM (
                    SELECT FROM applications WHERE id = $1 AND user_id = $2
                ) sub
            )
        ",
        application_id,
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

/// Verifies if an application is still open for submissions.
/// 
/// This function checks if the application has not been submitted and if the campaign
/// deadline has not passed.
/// 
/// # Arguments
/// 
/// * `application_id` - The ID of the application to check
/// * `pool` - Database connection pool
/// 
/// # Returns
/// 
/// * `Result<(), ChaosError>` - Ok if the application is open, ApplicationClosed error otherwise
pub async fn assert_application_is_open(
    application_id: i64,
    pool: &Pool<Postgres>,
) -> Result<(), ChaosError> {
    let time = Utc::now();
    let application = sqlx::query!(
        "
            SELECT submitted, c.ends_at FROM applications a
            JOIN campaigns c on c.id = a.campaign_id
            WHERE a.id = $1
        ",
        application_id
    )
        .fetch_one(pool)
        .await?;

    if application.submitted || application.ends_at <= time {
        return Err(ChaosError::ApplicationClosed)
    }

    Ok(())
}
