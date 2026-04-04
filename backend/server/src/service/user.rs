//! Role service for the Chaos application.
//!
//! This module provides functionality for managing campaign roles, including:
//! - Verifying role admin privileges

use crate::models::error::ChaosError;
use sqlx::{Postgres, Transaction};
use std::ops::DerefMut;

/// Verifies if a user exists based on the given email
///
/// This function checks the database to see if a user exists with the given email. Returns an id
/// if successful.
///
/// # Arguments
///
/// * `username` - The username of the user to check
/// * `pool` - Database connection pool
///
/// # Returns
///
/// * `Result<i64, ChaosError>` - User id if the user exists, Bad Request error otherwise
pub async fn user_exists_by_email(
    email: String,
    transaction: &mut Transaction<'_, Postgres>,
) -> Result<i64, ChaosError> {
    let user = sqlx::query!(
        "
            SELECT id FROM users WHERE email = $1
        ",
        email
    )
    .fetch_optional(transaction.deref_mut())
    .await?;

    if let Some(user_record) = user {
        Ok(user_record.id)
    } else {
        Err(ChaosError::BadRequest)
    }
}
