//! Offer handler for the Chaos application.
//! 
//! This module provides HTTP request handlers for managing offers, including:
//! - Creating and retrieving offers
//! - Replying to offers
//! - Previewing and sending offer emails

use crate::models::app::AppState;
use crate::models::auth::{OfferAdmin, OfferRecipient};
use crate::models::error::ChaosError;
use crate::models::offer::{Offer, OfferReply};
use crate::models::transaction::DBTransaction;
use axum::extract::{Json, Path, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;

/// Handler for offer-related HTTP requests.
pub struct OfferHandler;

impl OfferHandler {
    /// Retrieves the details of a specific offer.
    /// 
    /// This handler allows offer admins to view offer details.
    /// 
    /// # Arguments
    /// 
    /// * `transaction` - Database transaction
    /// * `id` - The ID of the offer to retrieve
    /// * `_user` - The authenticated user (must be an offer admin)
    /// 
    /// # Returns
    /// 
    /// * `Result<impl IntoResponse, ChaosError>` - Offer details or error
    pub async fn get(
        mut transaction: DBTransaction<'_>,
        Path(id): Path<i64>,
        _user: OfferAdmin,
    ) -> Result<impl IntoResponse, ChaosError> {
        let offer = Offer::get(id, &mut transaction.tx).await?;
        transaction.tx.commit().await?;

        Ok((StatusCode::OK, Json(offer)))
    }

    /// Deletes an offer.
    /// 
    /// This handler allows offer admins to delete offers.
    /// 
    /// # Arguments
    /// 
    /// * `transaction` - Database transaction
    /// * `id` - The ID of the offer to delete
    /// * `_user` - The authenticated user (must be an offer admin)
    /// 
    /// # Returns
    /// 
    /// * `Result<impl IntoResponse, ChaosError>` - Success message or error
    pub async fn delete(
        mut transaction: DBTransaction<'_>,
        Path(id): Path<i64>,
        _user: OfferAdmin,
    ) -> Result<impl IntoResponse, ChaosError> {
        Offer::delete(id, &mut transaction.tx).await?;
        transaction.tx.commit().await?;

        Ok((StatusCode::OK, "Successfully deleted offer"))
    }

    /// Allows a recipient to reply to an offer.
    /// 
    /// This handler allows offer recipients to accept or decline offers.
    /// 
    /// # Arguments
    /// 
    /// * `transaction` - Database transaction
    /// * `id` - The ID of the offer to reply to
    /// * `_user` - The authenticated user (must be the offer recipient)
    /// * `reply` - The recipient's response
    /// 
    /// # Returns
    /// 
    /// * `Result<impl IntoResponse, ChaosError>` - Success message or error
    pub async fn reply(
        mut transaction: DBTransaction<'_>,
        Path(id): Path<i64>,
        _user: OfferRecipient,
        Json(reply): Json<OfferReply>,
    ) -> Result<impl IntoResponse, ChaosError> {
        Offer::reply(id, reply.accept, &mut transaction.tx).await?;
        transaction.tx.commit().await?;

        Ok((StatusCode::OK, "Successfully accepted offer"))
    }

    /// Previews the email that will be sent for an offer.
    /// 
    /// This handler allows offer admins to preview the offer email before sending.
    /// 
    /// # Arguments
    /// 
    /// * `transaction` - Database transaction
    /// * `id` - The ID of the offer
    /// * `_user` - The authenticated user (must be an offer admin)
    /// 
    /// # Returns
    /// 
    /// * `Result<impl IntoResponse, ChaosError>` - Email preview or error
    pub async fn preview_email(
        mut transaction: DBTransaction<'_>,
        Path(id): Path<i64>,
        _user: OfferAdmin,
    ) -> Result<impl IntoResponse, ChaosError> {
        let email_parts = Offer::preview_email(id, &mut transaction.tx).await?;
        transaction.tx.commit().await?;

        Ok((StatusCode::OK, Json(email_parts)))
    }

    /// Sends an offer email to the recipient.
    /// 
    /// This handler allows offer admins to send offer emails.
    /// 
    /// # Arguments
    /// 
    /// * `transaction` - Database transaction
    /// * `id` - The ID of the offer to send
    /// * `_user` - The authenticated user (must be an offer admin)
    /// * `state` - The application state containing email credentials
    /// 
    /// # Returns
    /// 
    /// * `Result<impl IntoResponse, ChaosError>` - Success message or error
    pub async fn send_offer(
        mut transaction: DBTransaction<'_>,
        Path(id): Path<i64>,
        _user: OfferAdmin,
        State(state): State<AppState>,
    ) -> Result<impl IntoResponse, ChaosError> {
        Offer::send_offer(id, &mut transaction.tx, state.email_credentials).await?;
        transaction.tx.commit().await?;

        Ok((StatusCode::OK, "Successfully sent offer"))
    }
}
