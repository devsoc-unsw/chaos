//! Rating handler for the Chaos application.
//!
//! This module provides HTTP request handlers for managing application ratings, including:
//! - Updating ratings
//! - Retrieving rating details
//! - Deleting ratings

use crate::models::app::{AppMessage, AppState};
use crate::models::auth::{ApplicationReviewerGivenApplicationId, CampaignAdmin, RatingCreator};
use crate::models::error::ChaosError;
use crate::models::rating::{
    NewApplicationCategoryRating, NewApplicationRating, NewCategoryRating, NewRating, Rating,
    UpdateCategoryRating,
};
use crate::models::transaction::DBTransaction;
use axum::extract::{Json, Path, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;

/// Handler for rating-related HTTP requests.
pub struct RatingHandler;

impl RatingHandler {
    // ----------------------- CategoryRating Operations ---------------------------

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
        let categories =
            Rating::get_categories_by_campaign(campaign_id, &mut transaction.tx).await?;

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
        _admin: CampaignAdmin,
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

    // ------------------- ApplicationRating Operations ----------------

    /// Creates a new rating with comment and category scores.
    /// Done this by calling 2 functions in models to first create application_rating first with comment
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

        Ok(AppMessage::OkMessage(
            "Successfully created application rating together with all category ratings.",
        ))
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
        let ratings =
            Rating::get_all_ratings_from_application_id(application_id, &mut transaction.tx)
                .await?;

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
            &mut transaction.tx,
        )
        .await?;

        transaction.tx.commit().await?;

        Ok(AppMessage::OkMessage(
            "Successfully created category rating for existing application rating",
        ))
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
        Rating::update_category_rating(category_rating_id, data.rating, &mut transaction.tx)
            .await?;

        transaction.tx.commit().await?;

        Ok(AppMessage::OkMessage(
            "Successfully updated category rating",
        ))
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

        Ok(AppMessage::OkMessage(
            "Successfully deleted category rating",
        ))
    }
}

#[cfg(test)]
mod tests {
    // =========================================================================
    // TEST PLAN – HTTP integration (handler + extractors + auth + DB)
    // =========================================================================
    //
    // Handlers driven through the real Router via oneshot against a #[sqlx::test] DB:
    //   · POST /api/v1/campaign/:campaign_id/rating_category   -> create_category (CampaignAdmin)
    //   · GET  /api/v1/campaign/:campaign_id/rating_categories -> get_categories_by_campaign
    //
    //  ID    Scenario                       Expected                          Test
    //  EP01  create, no auth cookie         401, no category                  create_requires_authentication
    //  EP02  create as non-admin            403, no category                  create_rejected_for_non_admin
    //  EP03  create as campaign admin       200 + category row                admin_creates_category
    //  EP04  create then GET categories     category returned                 created_category_is_listed
    //
    // KNOWN GAPS: application rating create/update (reviewer + category scores) and
    // the RatingCreator-guarded category-rating handlers need a submitted
    // application and reviewer membership; they share this wiring and are not each
    // driven here.
    // =========================================================================

    use super::*;
    use crate::test_support::*;
    use axum::http::StatusCode;
    use axum::routing::{get, post};
    use axum::Router;
    use sqlx::PgPool;
    use tower::ServiceExt;

    /// user 1 (plain), user 2 (org Admin), org 1 → campaign 1.
    async fn seed(pool: &PgPool) {
        seed_user(pool, 1, "user@test.com").await;
        seed_user(pool, 2, "admin@test.com").await;
        seed_org(pool, 1, "org").await;
        seed_org_member(pool, 1, 2, "Admin").await;
        seed_campaign(pool, 1, 1, true).await;
    }

    fn router(pool: PgPool) -> Router {
        Router::new()
            .route(
                "/api/v1/campaign/:campaign_id/rating_category",
                post(RatingHandler::create_category),
            )
            .route(
                "/api/v1/campaign/:campaign_id/rating_categories",
                get(RatingHandler::get_categories_by_campaign),
            )
            .with_state(test_state(pool))
    }

    async fn category_count(pool: &PgPool) -> i64 {
        sqlx::query_scalar("SELECT COUNT(*) FROM campaign_rating_categories")
            .fetch_one(pool)
            .await
            .unwrap()
    }

    /// White-box: creating a category requires authentication.
    #[sqlx::test(migrations = "../migrations")]
    async fn create_requires_authentication(pool: PgPool) {
        seed(&pool).await;

        let response = router(pool.clone())
            .oneshot(request(
                "POST",
                "/api/v1/campaign/1/rating_category",
                None,
                Some(serde_json::json!({ "name": "Technical" })),
            ))
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
        assert_eq!(category_count(&pool).await, 0);
    }

    /// White-box: a non-admin is rejected by the CampaignAdmin guard.
    #[sqlx::test(migrations = "../migrations")]
    async fn create_rejected_for_non_admin(pool: PgPool) {
        seed(&pool).await;

        let response = router(pool.clone())
            .oneshot(request(
                "POST",
                "/api/v1/campaign/1/rating_category",
                Some(1),
                Some(serde_json::json!({ "name": "Technical" })),
            ))
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::FORBIDDEN);
        assert_eq!(category_count(&pool).await, 0);
    }

    /// White-box: a campaign admin creates a rating category.
    #[sqlx::test(migrations = "../migrations")]
    async fn admin_creates_category(pool: PgPool) {
        seed(&pool).await;

        let response = router(pool.clone())
            .oneshot(request(
                "POST",
                "/api/v1/campaign/1/rating_category",
                Some(2),
                Some(serde_json::json!({ "name": "Technical" })),
            ))
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
        assert_eq!(category_count(&pool).await, 1);
    }

    /// White-box: a created category is returned by the categories GET.
    #[sqlx::test(migrations = "../migrations")]
    async fn created_category_is_listed(pool: PgPool) {
        seed(&pool).await;

        router(pool.clone())
            .oneshot(request(
                "POST",
                "/api/v1/campaign/1/rating_category",
                Some(2),
                Some(serde_json::json!({ "name": "Technical" })),
            ))
            .await
            .unwrap();

        let response = router(pool.clone())
            .oneshot(request(
                "GET",
                "/api/v1/campaign/1/rating_categories",
                Some(2),
                None,
            ))
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
        let json = body_json(response).await;
        let categories = json.as_array().expect("categories should be an array");
        assert_eq!(categories.len(), 1);
        assert_eq!(categories[0]["name"], serde_json::json!("Technical"));
    }
}
