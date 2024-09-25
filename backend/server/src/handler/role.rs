use crate::models::app::AppState;
use crate::models::application::Application;
use crate::models::auth::{AuthUser, RoleAdmin};
use crate::models::error::ChaosError;
use crate::models::role::{Role, RoleUpdate};
use axum::extract::{Json, Path, State};
use crate::models::transaction::DBTransaction;
use axum::http::StatusCode;
use axum::response::IntoResponse;

pub struct RoleHandler;

impl RoleHandler {
    pub async fn get(
        State(state): State<AppState>,
        Path(id): Path<i64>,
        _user: AuthUser,
    ) -> Result<impl IntoResponse, ChaosError> {
        let role = Role::get(id, &state.db).await?;
        Ok((StatusCode::OK, Json(role)))
    }

    pub async fn delete(
        State(state): State<AppState>,
        Path(id): Path<i64>,
        _admin: RoleAdmin,
    ) -> Result<impl IntoResponse, ChaosError> {
        Role::delete(id, &state.db).await?;
        Ok((StatusCode::OK, "Successfully deleted role"))
    }

    pub async fn update(
        State(state): State<AppState>,
        Path(id): Path<i64>,
        _admin: RoleAdmin,
        Json(data): Json<RoleUpdate>,
    ) -> Result<impl IntoResponse, ChaosError> {
        Role::update(id, data, &state.db).await?;
        Ok((StatusCode::OK, "Successfully updated role"))
    }

    pub async fn get_applications(
        Path(id): Path<i64>,
        _admin: RoleAdmin,
        mut transaction: DBTransaction<'_>,
    ) -> Result<impl IntoResponse, ChaosError> {
        let applications = Application::get_from_role_id(id, &mut transaction.tx).await?;
        transaction.tx.commit().await?;
        Ok((StatusCode::OK, Json(applications)))
    }
}
