use crate::models::app::AppState;
use crate::models::auth::AuthUser;
use axum::http::StatusCode;
use crate::models;
use crate::service;
use axum::extract::{Path, State, Json};
use axum::response::IntoResponse;

pub async fn get_organisations(
    State(state): State<AppState>,
    _user: AuthUser
) -> Result<impl IntoResponse, impl IntoResponse> {
    match service::organisation::get_organisations(state.db).await {
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
    _user: AuthUser,
    Json(request_body): Json<models::organisation::Organisation>,
) -> Result<impl IntoResponse, impl IntoResponse> {
    match service::organisation::update_organisation(organisation_id, Some(request_body.name), request_body.logo, state.db).await {
        Ok(organisation) => Ok((StatusCode::OK, Json(organisation))),
        Err(e) => return Err((StatusCode::NOT_FOUND, e.to_string())),
    }
}

pub async fn delete_organisation(
    State(state): State<AppState>,
    Path(organisation_id): Path<i64>,
    _user: AuthUser
) -> Result<impl IntoResponse, impl IntoResponse> {
    match service::organisation::delete_organisation(organisation_id, _user.user_id, state.db).await {
        Ok(organisation) => Ok((StatusCode::OK, Json(organisation))),
        Err(e) => return Err((StatusCode::NOT_FOUND, e.to_string())),
    }
}

pub async fn create_organisation(
    State(state): State<AppState>,
    _user: AuthUser,
    Json(request_body): Json<models::organisation::Organisation>
) -> Result<impl IntoResponse, impl IntoResponse> {
    let mut snowflake_generator = state.snowflake_generator;
    let new_organisation_id = snowflake_generator.real_time_generate();

    match service::organisation::create_organisation(new_organisation_id, request_body.name, request_body.logo, state.db).await {
        Ok(organisation) => Ok((StatusCode::OK, Json(organisation))),
        Err(e) => return Err((StatusCode::NOT_FOUND, e.to_string())),
    }
}

pub async fn get_organisation_admins(
    State(state): State<AppState>,
    Path(organisation_id): Path<i64>,
    _user: AuthUser
) -> Result<impl IntoResponse, impl IntoResponse> {
    match service::organisation::get_organisation_admins(organisation_id, state.db).await {
        Ok(organisation_admins) => Ok((StatusCode::OK, Json(organisation_admins))),
        Err(e) => return Err((StatusCode::NOT_FOUND, e.to_string())),
    }
}

pub async fn add_admin_to_organisation(
    State(state): State<AppState>,
    Path(organisation_id): Path<i64>,
    _user: AuthUser
) -> Result<impl IntoResponse, impl IntoResponse> {
    match service::organisation::add_admin_to_organisation(organisation_id, _user.user_id, state.db).await {
        Ok(organisation_admins) => Ok((StatusCode::OK, Json(organisation_admins))),
        Err(e) => return Err((StatusCode::NOT_FOUND, e.to_string())),
    }
}

pub async fn remove_admin_from_organisation(
    State(state): State<AppState>,
    Path(organisation_id): Path<i64>,
    _user: AuthUser
) -> Result<impl IntoResponse, impl IntoResponse> {
    match service::organisation::remove_admin_from_organisation(organisation_id, _user.user_id, state.db).await {
        Ok(organisation_admins) => Ok((StatusCode::OK, Json(organisation_admins))),
        Err(e) => return Err((StatusCode::NOT_FOUND, e.to_string())),
    }
}