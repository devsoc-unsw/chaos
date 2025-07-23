//! Rating service for the Chaos application.
//! 
//! This module provides functionality for managing application ratings, including:
//! - Verifying rating permissions
//! - Checking organisation membership for ratings
//! - Validating rating creator status

use crate::models::error::ChaosError;
use sqlx::{Pool, Postgres};

/// Verifies if a user can review an application based on a rating ID.
/// 
/// This function checks if the user is a member of the organisation that owns the campaign
/// the application belongs to. Currently, any member can review applications as they are
/// either directors or execs.
/// 
/// # Arguments
/// 
/// * `user_id` - The ID of the user to check
/// * `rating_id` - The ID of the rating
/// * `pool` - Database connection pool
/// 
/// # Returns
/// 
/// * `Result<(), ChaosError>` - Ok if the user can review, Unauthorized error otherwise
/// 
/// # Note
/// 
/// This behavior might change in the future to be more restrictive.
pub async fn assert_user_is_application_reviewer_given_rating_id(
    user_id: i64,
    rating_id: i64,
    pool: &Pool<Postgres>,
) -> Result<(), ChaosError> {
    let is_admin = sqlx::query!(
        r#"
        SELECT EXISTS (
            SELECT 1
            FROM organisation_members om
            JOIN campaigns c ON om.organisation_id = c.organisation_id
            JOIN applications a ON a.campaign_id = c.id
            JOIN application_ratings ar ON ar.application_id = a.id
            -- Find the organisation that this application rating belongs to
            -- (via the campaign the rating belongs to).
            WHERE ar.id = $1
            -- Assert user is member of the organisation that owns the campaign
            -- this application belongs to.
            AND om.user_id = $2
        )
        "#,
        rating_id,
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

/// Verifies if a user is both the creator of a rating and a current member of the organisation.
/// 
/// This function checks if:
/// 1. The user created the rating
/// 2. The user is still a member of the organisation that owns the campaign
/// 
/// # Arguments
/// 
/// * `user_id` - The ID of the user to check
/// * `rating_id` - The ID of the rating
/// * `pool` - Database connection pool
/// 
/// # Returns
/// 
/// * `Result<(), ChaosError>` - Ok if both conditions are met, Unauthorized error otherwise
pub async fn assert_user_is_rating_creator_and_organisation_member(
    user_id: i64,
    rating_id: i64,
    pool: &Pool<Postgres>,
) -> Result<(), ChaosError> {
    let is_admin = sqlx::query!(
        r#"
        SELECT EXISTS (
            SELECT 1
            FROM organisation_members om
            JOIN campaigns c ON om.organisation_id = c.organisation_id
            JOIN applications a ON a.campaign_id = c.id
            JOIN application_ratings ar ON ar.application_id = a.id
            -- Find the organisation that this application rating belongs to
            -- (via the campaign the rating belongs to).
            WHERE ar.id = $1
            -- Assert user is the rater of the application rating.
            AND ar.rater_id = $2
            -- Assert user is current member of the organisation that owns the
            -- campaign this application belongs to.
            AND om.user_id = $2
        )
        "#,
        rating_id,
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

/// Verifies if a user is a member of the organisation that owns an application.
/// 
/// This function checks if the user is a current member of the organisation that owns
/// the campaign the application belongs to.
/// 
/// # Arguments
/// 
/// * `user_id` - The ID of the user to check
/// * `application_id` - The ID of the application
/// * `pool` - Database connection pool
/// 
/// # Returns
/// 
/// * `Result<(), ChaosError>` - Ok if the user is a member, Unauthorized error otherwise
pub async fn assert_user_is_organisation_member(
    user_id: i64,
    application_id: i64,
    pool: &Pool<Postgres>,
) -> Result<(), ChaosError> {
    let is_admin = sqlx::query!(
        r#"
        SELECT EXISTS (
            SELECT 1
            FROM organisation_members om
            JOIN campaigns c ON om.organisation_id = c.organisation_id
            JOIN applications a ON a.campaign_id = c.id
            -- Find the organisation that this application rating belongs to
            -- (via the campaign the rating belongs to).
            WHERE a.id = $1
            -- Assert user is current member of the organisation that owns the
            -- campaign this application belongs to.
            AND om.user_id = $2
        )
        "#,
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
