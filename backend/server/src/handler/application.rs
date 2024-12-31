use crate::models::app::AppState;
use crate::models::application::{Application, ApplicationRoleUpdate, ApplicationStatus, OpenApplicationByApplicationId};
use crate::models::auth::{ApplicationAdmin, ApplicationOwner, ApplicationReviewerGivenApplicationId, AuthUser};
use crate::models::error::ChaosError;
use crate::models::transaction::DBTransaction;
use axum::extract::{Json, Path, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;
use crate::models::rating::{NewRating, Rating};

pub struct ApplicationHandler;

impl ApplicationHandler {
    pub async fn get(
        Path(application_id): Path<i64>,
        _admin: ApplicationAdmin,
        mut transaction: DBTransaction<'_>,
    ) -> Result<impl IntoResponse, ChaosError> {
        let application = Application::get(application_id, &mut transaction.tx).await?;
        transaction.tx.commit().await?;
        Ok((StatusCode::OK, Json(application)))
    }

    pub async fn set_status(
        State(state): State<AppState>,
        Path(application_id): Path<i64>,
        _admin: ApplicationAdmin,
        Json(data): Json<ApplicationStatus>,
    ) -> Result<impl IntoResponse, ChaosError> {
        Application::set_status(application_id, data, &state.db).await?;
        Ok((StatusCode::OK, "Status successfully updated"))
    }

    pub async fn set_private_status(
        State(state): State<AppState>,
        Path(application_id): Path<i64>,
        _admin: ApplicationAdmin,
        Json(data): Json<ApplicationStatus>,
    ) -> Result<impl IntoResponse, ChaosError> {
        Application::set_private_status(application_id, data, &state.db).await?;
        Ok((StatusCode::OK, "Private Status successfully updated"))
    }

    pub async fn get_from_curr_user(
        user: AuthUser,
        mut transaction: DBTransaction<'_>,
    ) -> Result<impl IntoResponse, ChaosError> {
        let applications = Application::get_from_user_id(user.user_id, &mut transaction.tx).await?;
        transaction.tx.commit().await?;
        Ok((StatusCode::OK, Json(applications)))
    }

    pub async fn update_roles(
        _user: ApplicationOwner,
        Path(application_id): Path<i64>,
        mut transaction: DBTransaction<'_>,
        Json(data): Json<ApplicationRoleUpdate>,
    ) -> Result<impl IntoResponse, ChaosError> {
        Application::update_roles(application_id, data.roles, &mut transaction.tx).await?;
        transaction.tx.commit().await?;
        Ok((StatusCode::OK, "Successfully updated application roles"))
    }

    pub async fn submit(
        _user: ApplicationOwner,
        _: OpenApplicationByApplicationId,
        Path(application_id): Path<i64>,
        mut transaction: DBTransaction<'_>,
    ) -> Result<impl IntoResponse, ChaosError> {
        Application::submit(application_id, &mut transaction.tx).await?;
        transaction.tx.commit().await?;
        Ok((StatusCode::OK, "Successfully submitted application"))
    }

    pub async fn create_rating(
        State(state): State<AppState>,
        Path(application_id): Path<i64>,
        admin: ApplicationReviewerGivenApplicationId,
        mut transaction: DBTransaction<'_>,
        Json(new_rating): Json<NewRating>,
    ) -> Result<impl IntoResponse, ChaosError> {
        Rating::create(
            new_rating,
            application_id,
            admin.user_id,
            state.snowflake_generator,
            &mut transaction.tx,
        )
            .await?;
        transaction.tx.commit().await?;
        Ok((StatusCode::OK, "Successfully created rating"))
    }

    pub async fn get_ratings(
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
}
