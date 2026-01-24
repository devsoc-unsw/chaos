//! Rating handler for the Chaos application.
//! 
//! This module provides HTTP request handlers for managing application ratings, including:
//! - Updating ratings
//! - Retrieving rating details
//! - Deleting ratings

use crate::models::app::{AppMessage, AppState};
use crate::models::auth::{
    ApplicationReviewerGivenApplicationId, ApplicationReviewerGivenRatingId, CampaignAdmin,
    RatingCreator,
};
use crate::models::error::ChaosError;
use crate::models::rating::{NewApplicationCategoryRating, NewApplicationRating, NewCategoryRating, NewRating, Rating, UpdateCategoryRating};
use crate::models::transaction::DBTransaction;
use axum::extract::{Json, Path, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;

/// Handler for rating-related HTTP requests.
pub struct RatingHandler;

impl RatingHandler {
    /// ----------------------- CateogoryRating Operations ---------------------------
    
    /// Creates a new rating category for a campaign.
    /// 
    /// # Arguments
    /// 
    /// * `state` - The application state
    /// * `campaign_id` - The ID of the campaign
    /// * `_admin` - The authenticated user (must be a campaign admin)
    /// * `transaction` - Database transaction
    /// * `data` - The category details
    pub async fn create_category(
        State(mut state): State<AppState>,
        Path(campaign_id): Path<i64>,
        _admin: CampaignAdmin,
        mut transaction: DBTransaction<'_>,
        Json(data): Json<NewCategoryRating>,
    ) -> Result<impl IntoResponse, ChaosError> {
        let category = Rating::create_category(
            data.name,
            campaign_id,
            &mut state.snowflake_generator,
            &mut transaction.tx,
        )
        .await?;

        transaction.tx.commit().await?;

        Ok((StatusCode::OK, Json(category)))
    }

    /// Retrieves all rating categories for a campaign.
    /// 
    /// # Arguments
    /// 
    /// * `campaign_id` - The ID of the campaign
    /// * `_admin` - The authenticated user (must be a campaign admin)
    /// * `transaction` - Database transaction
    pub async fn get_categories_by_campaign(
        Path(campaign_id): Path<i64>,
        _admin: CampaignAdmin,
        mut transaction: DBTransaction<'_>,
    ) -> Result<impl IntoResponse, ChaosError> {
        let categories = Rating::get_categories_by_campaign(campaign_id, &mut transaction.tx).await?;

        transaction.tx.commit().await?;

        Ok((StatusCode::OK, Json(categories)))
    }

    /// Updates a category's name.
    /// 
    /// # Arguments
    /// 
    /// * `campaign_id` - The ID of the campaign
    /// * `category_id` - The ID of the category to update
    /// * `_admin` - The Campaign admin (must be creator of the camapaign)
    /// * `transaction` - Database transaction
    /// * `data` - The updated rating comment
    pub async fn update_category(
        Path((_campaign_id, category_id)): Path<(i64, i64)>,
        _admin: CampaignAdmin ,
        mut transaction: DBTransaction<'_>,
        Json(data): Json<NewCategoryRating>,
    ) -> Result<impl IntoResponse, ChaosError> {
        Rating::update_category(category_id, data.name, &mut transaction.tx).await?;

        transaction.tx.commit().await?;

        Ok(AppMessage::OkMessage("Successfully updated category name."))
    }

    /// Deletes a rating category from a campaign.
    /// 
    /// # Arguments
    /// 
    /// * `campaign_id` - The ID of the campaign
    /// * `category_id` - The ID of the category to delete
    /// * `_admin` - The authenticated user (must be a campaign admin)
    /// * `transaction` - Database transaction
    pub async fn delete_category(
        Path((_campaign_id, category_id)): Path<(i64, i64)>,
        _admin: CampaignAdmin,
        mut transaction: DBTransaction<'_>,
    ) -> Result<impl IntoResponse, ChaosError> {
        Rating::delete_category(category_id, &mut transaction.tx).await?;

        transaction.tx.commit().await?;

        Ok(AppMessage::OkMessage("Successfully deleted category"))
    }

    /// ------------------- ApplicationRating Operations ----------------

    /// Creates a new rating with comment and category scores.
    /// Done this by calling 2 functions in models to first create application_rating first with commnet
    /// Followed by a for loop to create each category rating
    /// 
    /// # Arguments
    /// 
    /// * `state` - The application state
    /// * `application_id` - The ID of the application being rated
    /// * `admin` - The authenticated user (must be an application reviewer)
    /// * `transaction` - Database transaction
    /// * `data` - The rating data including comment and category scores
    pub async fn create(
        State(mut state): State<AppState>,
        Path(application_id): Path<i64>,
        admin: ApplicationReviewerGivenApplicationId,
        mut transaction: DBTransaction<'_>,
        Json(new_rating): Json<NewRating>,
    ) -> Result<impl IntoResponse, ChaosError> {
        let application_rating_id = Rating::create_application_rating(
            new_rating.comment,
            application_id,
            admin.user_id,
            &mut state.snowflake_generator,
            &mut transaction.tx,
        )
        .await?;

        for category_rating in new_rating.category_ratings {
            Rating::create_category_rating(
                category_rating,
                application_rating_id,
                &mut state.snowflake_generator,
                &mut transaction.tx,
            )
            .await?;
        }

        transaction.tx.commit().await?;

        Ok(AppMessage::OkMessage("Successfully created application rating together with all category ratings."))
    }

    // /// Retrieves a specific rating with all category scores.
    // /// 
    // /// # Arguments
    // /// 
    // /// * `rating_id` - The ID of the rating to retrieve
    // /// * `_admin` - The authenticated user (must be an application reviewer)
    // /// * `transaction` - Database transaction
    // pub async fn get(
    //     Path(rating_id): Path<i64>,
    //     _admin: ApplicationReviewerGivenRatingId,
    //     mut transaction: DBTransaction<'_>,
    // ) -> Result<impl IntoResponse, ChaosError> {
    //     let rating = Rating::get_rating(rating_id, &mut transaction.tx).await?;

    //     transaction.tx.commit().await?;

    //     Ok((StatusCode::OK, Json(rating)))
    // }

    /// Retrieves all ratings for an application.
    /// 
    /// # Arguments
    /// 
    /// * `application_id` - The ID of the application
    /// * `_admin` - The authenticated user (must be an application reviewer)
    /// * `transaction` - Database transaction
    pub async fn get_all_by_application(
        Path(application_id): Path<i64>,
        _admin: ApplicationReviewerGivenApplicationId,
        mut transaction: DBTransaction<'_>,
    ) -> Result<impl IntoResponse, ChaosError> {
        let ratings = Rating::get_all_ratings_from_application_id(application_id, &mut transaction.tx).await?;

        transaction.tx.commit().await?;

        Ok((StatusCode::OK, Json(ratings)))
    }

    /// Updates a rating's comment.
    /// 
    /// # Arguments
    /// 
    /// * `rating_id` - The ID of the rating to update
    /// * `_admin` - The authenticated user (must be the rating creator)
    /// * `transaction` - Database transaction
    /// * `data` - The updated rating comment
    pub async fn update_comment(
        Path(rating_id): Path<i64>,
        _admin: RatingCreator,
        mut transaction: DBTransaction<'_>,
        Json(data): Json<NewApplicationRating>,
    ) -> Result<impl IntoResponse, ChaosError> {
        Rating::update_application_rating(rating_id, data.comment, &mut transaction.tx).await?;

        transaction.tx.commit().await?;

        Ok(AppMessage::OkMessage("Successfully updated rating"))
    }

    /// Creates a new category rating for an existing application rating.
    /// 
    /// # Arguments
    /// 
    /// * `rating_id` - The ID of the application rating
    /// * `_admin` - The authenticated user (must be the rating creator)
    /// * `transaction` - Database transaction
    /// * `data` - The new category rating data
    pub async fn create_category_rating_from_existing_application_rating(
        State(mut state): State<AppState>,
        Path(rating_id): Path<i64>,
        _admin: RatingCreator,
        mut transaction: DBTransaction<'_>,
        Json(data): Json<NewApplicationCategoryRating>,
    ) -> Result<impl IntoResponse, ChaosError> {
        Rating::create_category_rating(
            data, 
            rating_id, 
            &mut state.snowflake_generator,
            &mut transaction.tx
        ).await?;
        
        transaction.tx.commit().await?;

        Ok(AppMessage::OkMessage("Successfully created category rating for existing application rating"))
    }

    /// Updates a specific category rating score.
    /// 
    /// # Arguments
    /// 
    /// * `rating_id` - The ID of the application rating
    /// * `category_rating_id` - The ID of the category rating to update
    /// * `_admin` - The authenticated user (must be the rating creator)
    /// * `transaction` - Database transaction
    /// * `data` - The updated rating score
    pub async fn update_category_rating(
        Path((_rating_id, category_rating_id)): Path<(i64, i64)>,
        _admin: RatingCreator,
        mut transaction: DBTransaction<'_>,
        Json(data): Json<UpdateCategoryRating>,
    ) -> Result<impl IntoResponse, ChaosError> {
        Rating::update_category_rating(category_rating_id, data.rating, &mut transaction.tx).await?;

        transaction.tx.commit().await?;

        Ok(AppMessage::OkMessage("Successfully updated category rating"))
    }

    /// Deletes a rating and all associated category scores.
    /// 
    /// # Arguments
    /// 
    /// * `rating_id` - The ID of the rating to delete
    /// * `_admin` - The authenticated user (must be the rating creator)
    /// * `transaction` - Database transaction
    pub async fn delete(
        Path(rating_id): Path<i64>,
        _admin: RatingCreator,
        mut transaction: DBTransaction<'_>,
    ) -> Result<impl IntoResponse, ChaosError> {
        Rating::delete_application_rating(rating_id, &mut transaction.tx).await?;

        transaction.tx.commit().await?;

        Ok(AppMessage::OkMessage("Successfully deleted rating"))
    }

    /// Deletes a specific category rating.
    /// 
    /// # Arguments
    /// 
    /// * `rating_id` - The ID of the application rating
    /// * `category_rating_id` - The ID of the category rating to delete
    /// * `_admin` - The authenticated user (must be the rating creator)
    /// * `transaction` - Database transaction
    pub async fn delete_category_rating(
        Path((_rating_id, category_rating_id)): Path<(i64, i64)>,
        _admin: RatingCreator,
        mut transaction: DBTransaction<'_>,
    ) -> Result<impl IntoResponse, ChaosError> {
        Rating::delete_category_rating(category_rating_id, &mut transaction.tx).await?;

        transaction.tx.commit().await?;

        Ok(AppMessage::OkMessage("Successfully deleted category rating"))
    }
}

