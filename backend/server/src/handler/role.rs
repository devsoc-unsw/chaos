use crate::models;
use crate::models::app::AppState;
use crate::models::auth::SuperUser;
use crate::models::auth::{AuthUser, OrganisationAdmin};
use crate::models::error::ChaosError;
use crate::models::role::{Role, RoleUpdate};
use crate::models::transaction::DBTransaction;
use crate::service;
use axum::extract::{Json, Path, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;

pub struct RoleHandler;

impl RoleHandler {
    pub async fn get(
        State(state): State<AppState>,
        Path(id): Path<i32>,
        _user: AuthUser,
    ) -> Result<impl IntoResponse, ChaosError> {
        let role = Role::get(id, &state.db).await?;
        Ok((StatusCode::OK, Json(role)))
    }

    pub async fn delete(
        State(state): State<AppState>,
        Path(id): Path<i32>,
        _admin: OrganisationAdmin,
    ) -> Result<impl IntoResponse, ChaosError> {
        Role::delete(id, &state.db).await?;
        Ok((StatusCode::OK, "Successfully deleted role"))
    }

    pub async fn update(
        State(state): State<AppState>,
        Path(id): Path<i32>,
        _admin: OrganisationAdmin,
        mut transaction: DBTransaction<'_>,
        Json(data): Json<RoleUpdate>,
    ) -> Result<impl IntoResponse, ChaosError> {
        Role::update(id, data, &mut transaction.tx,).await?;
        transaction.tx.commit().await?;
        Ok((StatusCode::OK, "Successfully updated role"))
    }
}