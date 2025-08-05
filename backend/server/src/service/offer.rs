//! Offer service for the Chaos application.
//! 
//! This module provides functionality for managing offers, including:
//! - Verifying offer admin privileges
//! - Verifying offer recipient status

use crate::models::error::ChaosError;
use crate::models::offer::Offer;
use sqlx::{Pool, Postgres, Transaction};
use std::ops::DerefMut;

/// Verifies if a user has admin privileges for an offer.
/// 
/// This function checks if the user is an admin of the organisation that owns the campaign
/// the offer belongs to.
/// 
/// # Arguments
/// 
/// * `user_id` - The ID of the user to check
/// * `offer_id` - The ID of the offer
/// * `pool` - Database connection pool
/// 
/// # Returns
/// 
/// * `Result<(), ChaosError>` - Ok if the user is an admin, Unauthorized error otherwise
pub async fn assert_user_is_offer_admin(
    user_id: i64,
    offer_id: i64,
    transaction: &mut Transaction<'_, Postgres>,
) -> Result<(), ChaosError> {
    let is_admin = sqlx::query!(
        "
            SELECT EXISTS(
                SELECT 1 FROM offers off
                JOIN campaigns c ON c.id = off.campaign_id
                JOIN organisation_members m on c.organisation_id = m.organisation_id
                WHERE off.id = $1 AND m.user_id = $2 AND m.role = 'Admin'
            )
        ",
        offer_id,
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

/// Verifies if a user is the recipient of an offer.
/// 
/// This function checks if the user is the intended recipient of the offer.
/// 
/// # Arguments
/// 
/// * `user_id` - The ID of the user to check
/// * `offer_id` - The ID of the offer
/// * `pool` - Database connection pool
/// 
/// # Returns
/// 
/// * `Result<(), ChaosError>` - Ok if the user is the recipient, Unauthorized error otherwise
pub async fn assert_user_is_offer_recipient(
    user_id: i64,
    offer_id: i64,
    transaction: &mut Transaction<'_, Postgres>,
) -> Result<(), ChaosError> {
    let offer = Offer::get(offer_id, transaction).await?;

    if offer.user_id != user_id {
        return Err(ChaosError::Unauthorized);
    }

    Ok(())
}
