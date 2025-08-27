//! Email template service for the Chaos application.
//! 
//! This module provides functionality for managing email templates, including:
//! - Verifying email template admin privileges

use crate::models::error::ChaosError;
use sqlx::{Pool, Postgres, Transaction};
use std::ops::DerefMut;

/// Verifies if a user has admin privileges for an email template.
/// 
/// This function checks if the user is an admin of the organisation that owns the template.
/// 
/// # Arguments
/// 
/// * `user_id` - The ID of the user to check
/// * `template_id` - The ID of the email template
/// * `pool` - Database connection pool
/// 
/// # Returns
/// 
/// * `Result<(), ChaosError>` - Ok if the user is an admin, Unauthorized error otherwise
pub async fn user_is_email_template_admin(
    user_id: i64,
    template_id: i64,
    transaction: &mut Transaction<'_, Postgres>,
) -> Result<(), ChaosError> {
    let is_admin = sqlx::query!(
        "
            SELECT EXISTS(
                SELECT 1 FROM email_templates et
                JOIN organisation_members m on et.organisation_id = m.organisation_id
                WHERE et.id = $1 AND m.user_id = $2 AND m.role = 'Admin'
            )
        ",
        template_id,
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
