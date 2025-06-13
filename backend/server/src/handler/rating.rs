//! Rating handler for the Chaos application.
//! 
//! This module provides HTTP request handlers for managing application ratings, including:
//! - Updating ratings
//! - Retrieving rating details
//! - Deleting ratings

use crate::models::app::AppState;
use crate::models::auth::{
    ApplicationReviewerGivenApplicationId, ApplicationReviewerGivenRatingId, RatingCreator,
};
use crate::models::error::ChaosError;
use crate::models::rating::{NewRating, Rating};
use crate::models::transaction::DBTransaction;
use axum::extract::{Json, Path, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;

/// Handler for rating-related HTTP requests.
pub struct RatingHandler;

impl RatingHandler {
    /// Updates an existing rating.
    /// 
    /// This handler allows the creator of a rating to update its details.
    /// 
    /// # Arguments
    /// 
    /// * `_state` - The application state
    /// * `rating_id` - The ID of the rating to update
    /// * `_admin` - The authenticated user (must be the rating creator)
    /// * `transaction` - Database transaction
    /// * `updated_rating` - The new rating details
    /// 
    /// # Returns
    /// 
    /// * `Result<impl IntoResponse, ChaosError>` - Success message or error
    pub async fn update(
        State(_state): State<AppState>,
        Path(rating_id): Path<i64>,
        _admin: RatingCreator,
        mut transaction: DBTransaction<'_>,
        Json(updated_rating): Json<NewRating>,
    ) -> Result<impl IntoResponse, ChaosError> {
        Rating::update(rating_id, updated_rating, &mut transaction.tx).await?;
        transaction.tx.commit().await?;
        Ok((StatusCode::OK, "Successfully updated rating"))
    }

    /// Retrieves the details of a specific rating.
    /// 
    /// This handler allows application reviewers to view rating details.
    /// 
    /// # Arguments
    /// 
    /// * `_state` - The application state
    /// * `rating_id` - The ID of the rating to retrieve
    /// * `_admin` - The authenticated user (must be an application reviewer)
    /// * `transaction` - Database transaction
    /// 
    /// # Returns
    /// 
    /// * `Result<impl IntoResponse, ChaosError>` - Rating details or error
    pub async fn get(
        State(_state): State<AppState>,
        Path(rating_id): Path<i64>,
        _admin: ApplicationReviewerGivenRatingId,
        mut transaction: DBTransaction<'_>,
    ) -> Result<impl IntoResponse, ChaosError> {
        let org = Rating::get_rating(rating_id, &mut transaction.tx).await?;
        transaction.tx.commit().await?;
        Ok((StatusCode::OK, Json(org)))
    }

    /// Deletes a rating.
    /// 
    /// This handler allows the creator of a rating to delete it.
    /// 
    /// # Arguments
    /// 
    /// * `_state` - The application state
    /// * `rating_id` - The ID of the rating to delete
    /// * `_admin` - The authenticated user (must be the rating creator)
    /// * `transaction` - Database transaction
    /// 
    /// # Returns
    /// 
    /// * `Result<impl IntoResponse, ChaosError>` - Success message or error
    pub async fn delete(
        State(_state): State<AppState>,
        Path(rating_id): Path<i64>,
        _admin: RatingCreator,
        mut transaction: DBTransaction<'_>,
    ) -> Result<impl IntoResponse, ChaosError> {
        Rating::delete(rating_id, &mut transaction.tx).await?;
        transaction.tx.commit().await?;
        Ok((StatusCode::OK, "Successfully deleted rating"))
    }
}
