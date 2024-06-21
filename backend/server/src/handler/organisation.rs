use crate::models;
use crate::models::app::AppState;
use crate::models::auth::AuthUser;
use crate::models::auth::SuperUser;
use crate::models::organisation::{AdminToRemove, AdminUpdateList, NewOrganisation};
use crate::service;
use axum::extract::{Json, Path, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;

pub async fn get_organisation(
    State(state): State<AppState>,
    Path(organisation_id): Path<i64>,
) -> Result<impl IntoResponse, impl IntoResponse> {
    match service::organisation::get_organisation(organisation_id, &state.db).await {
        Ok(organisation_details) => Ok((StatusCode::OK, Json(organisation_details))),
        Err(e) => return Err((StatusCode::NOT_FOUND, e.to_string())),
    }
}

pub async fn update_organisation_logo(
    State(state): State<AppState>,
    Path(organisation_id): Path<i64>,
    user: AuthUser,
) -> Result<impl IntoResponse, impl IntoResponse> {
    match service::organisation::update_organisation_logo(organisation_id, user.user_id, &state.db)
        .await
    {
        Ok(logo_url) => Ok((StatusCode::OK, Json(logo_url))),
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    }
}

pub async fn delete_organisation(
    State(state): State<AppState>,
    Path(organisation_id): Path<i64>,
    _user: SuperUser,
) -> Result<impl IntoResponse, impl IntoResponse> {
    match service::organisation::delete_organisation(organisation_id, &state.db).await {
        Ok(organisation) => Ok((StatusCode::OK, Json(organisation))),
        Err(e) => return Err((StatusCode::UNAUTHORIZED, e.to_string())),
    }
}

pub async fn create_organisation(
    State(state): State<AppState>,
    _user: SuperUser,
    Json(data): Json<NewOrganisation>,
) -> Result<impl IntoResponse, impl IntoResponse> {
    match service::organisation::create_organisation(
        data.admin,
        data.name,
        state.snowflake_generator,
        &state.db,
    )
    .await
    {
        Ok(message) => Ok((StatusCode::OK, Json(message))),
        Err(e) => return Err((StatusCode::NOT_FOUND, e.to_string())),
    }
}

pub async fn get_organisation_admins(
    State(state): State<AppState>,
    Path(organisation_id): Path<i64>,
    user: AuthUser,
) -> Result<impl IntoResponse, impl IntoResponse> {
    match service::organisation::get_organisation_members(organisation_id, state.db).await {
        Ok(organisation_admins) => Ok((StatusCode::OK, Json(organisation_admins))),
        Err(e) => return Err((StatusCode::NOT_FOUND, e.to_string())),
    }
}

pub async fn update_organisation_admins(
    State(state): State<AppState>,
    Path(organisation_id): Path<i64>,
    Json(request_body): Json<AdminUpdateList>,
    user: SuperUser,
) -> Result<impl IntoResponse, impl IntoResponse> {
    match service::organisation::update_organisation_admins(
        organisation_id,
        user.user_id,
        request_body.members,
        &state.db,
    )
    .await
    {
        Ok(organisation_admins) => Ok((StatusCode::OK, Json(organisation_admins))),
        Err(e) => return Err((StatusCode::NOT_FOUND, e.to_string())),
    }
}

pub async fn remove_admin_from_organisation(
    State(state): State<AppState>,
    Path(organisation_id): Path<i64>,
    user: AuthUser,
    Json(request_body): Json<AdminToRemove>,
) -> Result<impl IntoResponse, impl IntoResponse> {
    match service::organisation::remove_admin_from_organisation(
        organisation_id,
        user.user_id,
        request_body.user_id,
        &state.db,
    )
    .await
    {
        Ok(organisation_admins) => Ok((StatusCode::OK, Json(organisation_admins))),
        Err(e) => return Err((StatusCode::NOT_FOUND, e.to_string())),
    }
}

pub async fn get_organisation_campaigns(
    State(state): State<AppState>,
    Path(organisation_id): Path<i64>,
) -> Result<impl IntoResponse, impl IntoResponse> {
    match service::organisation::get_organisation_campaigns(organisation_id, state.db).await {
        Ok(organisation_admins) => Ok((StatusCode::OK, Json(organisation_admins))),
        Err(e) => return Err((StatusCode::NOT_FOUND, e.to_string())),
    }
}

pub async fn create_campaign_for_organisation(
    State(state): State<AppState>,
    _user: SuperUser,
    Json(request_body): Json<models::campaign::Campaign>,
) -> Result<impl IntoResponse, impl IntoResponse> {
    let mut snowflake_generator = state.snowflake_generator;
    let new_campaign_id = snowflake_generator.real_time_generate();

    match service::organisation::create_campaign_for_organisation(
        new_campaign_id,
        request_body.name,
        request_body.description,
        request_body.starts_at,
        request_body.ends_at,
        state.db,
    )
    .await
    {
        Ok(message) => Ok((StatusCode::OK, Json(message))),
        Err(e) => return Err((StatusCode::NOT_FOUND, e.to_string())),
    }
}
