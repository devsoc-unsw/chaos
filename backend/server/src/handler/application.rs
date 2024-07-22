use crate::models::app::AppState;
use crate::models::application::{Application, ApplicationStatus};
use crate::models::auth::{ApplicationAdmin, RoleAdmin, CampaignAdmin};
use crate::models::error::ChaosError;
use crate::models::transaction::DBTransaction;
use axum::extract::{Json, Path, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;

pub struct ApplicationHandler;

impl ApplicationHandler {
    pub async fn get_from_role_id(
        State(state): State<AppState>,
        Path(id): Path<i64>,
        _admin: RoleAdmin,
        mut transaction: DBTransaction<'_>,
    ) -> Result<impl IntoResponse, ChaosError> {
        let applications = Application::get_from_role_id(id, &mut transaction.tx).await?;
        transaction.tx.commit().await?;
        Ok((StatusCode::OK, Json(applications)))
    }

    pub async fn get_from_campaign_id(
        State(state): State<AppState>,
        Path(id): Path<i64>,
        _admin: CampaignAdmin,
        mut transaction: DBTransaction<'_>,
    ) -> Result<impl IntoResponse, ChaosError> {
        let applications = Application::get_from_campaign_id(id, &mut transaction.tx).await?;
        transaction.tx.commit().await?;
        Ok((StatusCode::OK, Json(applications)))
    }

    pub async fn set_status(
        State(state): State<AppState>,
        Path(id): Path<i64>,
        _admin: ApplicationAdmin,
        Json(data): Json<ApplicationStatus>,
    ) -> Result<impl IntoResponse, ChaosError> {
        Application::set_status(id, data, &state.db).await?;
        Ok((StatusCode::OK, "Status successfully updated"))
    }

    pub async fn set_private_status(
        State(state): State<AppState>,
        Path(id): Path<i64>,
        _admin: ApplicationAdmin,
        Json(data): Json<ApplicationStatus>,
    ) -> Result<impl IntoResponse, ChaosError> {
        Application::set_private_status(id, data, &state.db).await?;
        Ok((StatusCode::OK, "Private Status successfully updated"))
    }
}