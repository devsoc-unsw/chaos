use crate::models::app::AppState;
use crate::models::auth::AuthUser;
use axum::http::StatusCode;
use crate::service;
use axum::extract::{Path, State};
use axum::Json;
use axum::response::IntoResponse;
use crate::models;

pub async fn get_organisation_name(
    State(state): State<AppState>,
    Path(organisation_id): Path<i64>,
    _user: AuthUser
) -> Result<impl IntoResponse, impl IntoResponse> {
    match service::organisation::get_organisation_name(organisation_id, state.db).await {
        Ok(organisation) => Ok((StatusCode::OK, Json(organisation))),
        Err(e) => return Err((StatusCode::NOT_FOUND, e.to_string())),
    }
}

pub async fn get_organisation(
    State(state): State<AppState>,
    Path(organisation_id): Path<i64>,
    _user: AuthUser
) -> Result<impl IntoResponse, impl IntoResponse> {
    match service::organisation::get_organisation(organisation_id, state.db).await {
        Ok(organisation) => Ok((StatusCode::OK, Json(organisation))),
        Err(e) => return Err((StatusCode::NOT_FOUND, e.to_string())),
    }
}

pub async fn update_organisation(
    State(state): State<AppState>,
    Path(organisation_id): Path<i64>,
    _user: SuperUser,
    Json(request_body): Json<models::organisation::Organisation>
) -> Result<impl IntoResponse, impl IntoResponse> {
    match service::organisation::update_organisation(organisation_id, request_body.name, request_body.logo, state.db).await {
        Ok(organisation) => Ok((StatusCode::OK, Json(organisation))),
        Err(e) => return Err((StatusCode::NOT_FOUND, e.to_string())),
    }
}

pub async fn delete_organisation(
    State(state): State<AppState>,
    Path(organisation_id): Path<i64>,
    _user: SuperUser,
) -> Result<impl IntoResponse, impl IntoResponse> {
    match service::organisation::update_organisation(organisation_id, state.db).await {
        Ok(organisation) => Ok((StatusCode::OK, Json(organisation))),
        Err(e) => return Err((StatusCode::NOT_FOUND, e.to_string())),
    }
}

pub async fn create_organisation(
    State(state): State<AppState>,
    Path(organisation_id): Path<i64>,
    _user: SuperUser,
    Json(request_body): Json<models::organisation::Organisation>
) -> Result<impl IntoResponse, impl IntoResponse> {
    match service::organisation::create_organisation(organisation_id, request_body.name, request_body.logo, state.db).await {
        Ok(organisation) => Ok((StatusCode::OK, Json(organisation))),
        Err(e) => return Err((StatusCode::NOT_FOUND, e.to_string())),
    }
}