use crate::models::app::AppState;
use crate::models::auth::SuperUser;
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
        _user: SuperUser,
        mut transaction: DBTransaction<'_>,
        Json(new_rating): Json<NewRating>,
    ) -> Result<impl IntoResponse, ChaosError> {
        Rating::create(new_rating, state.snowflake_generator, &mut transaction.tx).await?;
        transaction.tx.commit().await?;
        Ok((StatusCode::OK, "Successfully created rating"))
    }

    pub async fn get_ratings_for_application(
        State(_state): State<AppState>,
        Path(application_id): Path<i64>,
        _user: SuperUser,
        mut transaction: DBTransaction<'_>,
    ) -> Result<impl IntoResponse, ChaosError> {
        let ratings =
            Rating::get_all_ratings_from_application_id(application_id, &mut transaction.tx)
                .await?;
        transaction.tx.commit().await?;
        Ok((StatusCode::OK, Json(ratings)))
    }

    // TODO: should I use transaction here? Organisation still uses state.db for these simpler getters.
    pub async fn get(
        State(_state): State<AppState>,
        Path(rating_id): Path<i64>,
        _user: SuperUser,
        mut transaction: DBTransaction<'_>,
    ) -> Result<impl IntoResponse, ChaosError> {
        let org = Rating::get_rating(rating_id, &mut transaction.tx).await?;
        transaction.tx.commit().await?;
        Ok((StatusCode::OK, Json(org)))
    }

    // TODO: should I use transaction here?
    pub async fn delete(
        State(_state): State<AppState>,
        Path(id): Path<i64>,
        _user: SuperUser,
        mut transaction: DBTransaction<'_>,
    ) -> Result<impl IntoResponse, ChaosError> {
        Rating::delete(id, &mut transaction.tx).await?;
        transaction.tx.commit().await?;
        Ok((StatusCode::OK, "Successfully deleted rating"))
    }
}
