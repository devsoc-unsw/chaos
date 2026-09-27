//! Application service for the Chaos application.
//!
//! This module provides functionality for managing applications, including:
//! - Checking application status and deadlines

use crate::models::error::ChaosError;
use chrono::Utc;
use sqlx::{Postgres, Transaction};
use std::ops::DerefMut;

/// Verifies if an application is still open for submissions.
///
/// This function checks if the application has not been submitted and if the campaign
/// deadline has not passed.
///
/// # Arguments
///
/// * `application_id` - The ID of the application to check
/// * `transaction` - Database transaction
///
/// # Returns
///
/// * `Result<(), ChaosError>` - Ok if the application is open, ApplicationClosed error otherwise
pub async fn assert_application_is_open(
    application_id: i64,
    transaction: &mut Transaction<'_, Postgres>,
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
    .fetch_one(transaction.deref_mut())
    .await?;

    if application.submitted || application.ends_at <= time {
        return Err(ChaosError::ApplicationClosed);
    }

    Ok(())
}
