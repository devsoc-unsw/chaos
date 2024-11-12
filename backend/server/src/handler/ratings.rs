use crate::models::app::AppState;
use crate::models::auth::{
    ApplicationCreatorGivenApplicationId, ApplicationReviewerGivenApplicationId,
    ApplicationReviewerGivenRatingId, RatingCreator, SuperUser,
};
use crate::models::error::ChaosError;
use crate::models::ratings::{NewRating, Rating};
use crate::models::transaction::DBTransaction;
use axum::extract::{Json, Path, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;

pub struct RatingsHandler;

impl RatingsHandler {
    // TODO: are all the user permissions as required? Who should be able to do what with ratings?
    pub async fn create_rating(
        State(state): State<AppState>,
        Path(application_id): Path<i64>,
        _admin: ApplicationCreatorGivenApplicationId,
        mut transaction: DBTransaction<'_>,
        Json(new_rating): Json<NewRating>,
    ) -> Result<impl IntoResponse, ChaosError> {
        Rating::create(
            new_rating,
            application_id,
            state.snowflake_generator,
            &mut transaction.tx,
        )
        .await?;
        transaction.tx.commit().await?;
        Ok((StatusCode::OK, "Successfully created rating"))
    }

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

    pub async fn get_ratings_for_application(
        State(_state): State<AppState>,
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

    pub async fn delete(
        State(_state): State<AppState>,
        Path(rating_id): Path<i64>,
        _admin: ApplicationReviewerGivenRatingId,
        mut transaction: DBTransaction<'_>,
    ) -> Result<impl IntoResponse, ChaosError> {
        Rating::delete(rating_id, &mut transaction.tx).await?;
        transaction.tx.commit().await?;
        Ok((StatusCode::OK, "Successfully deleted rating"))
    }
}
