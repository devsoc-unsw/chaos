use crate::models::app::AppState;
use crate::models::auth::{
    ApplicationReviewerGivenRatingId, RatingCreator,
};
use crate::models::error::ChaosError;
use crate::models::rating::{NewRating, Rating};
use crate::models::transaction::DBTransaction;
use axum::extract::{Json, Path, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;

pub struct RatingHandler;

impl RatingHandler {
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
        _admin: RatingCreator,
        mut transaction: DBTransaction<'_>,
    ) -> Result<impl IntoResponse, ChaosError> {
        Rating::delete(rating_id, &mut transaction.tx).await?;
        transaction.tx.commit().await?;
        Ok((StatusCode::OK, "Successfully deleted rating"))
    }
}
