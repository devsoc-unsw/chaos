use axum::{extract::{Json, Path, State}, http::StatusCode, response::IntoResponse};

use crate::{models::{self, app::AppState, auth::{AuthUser, SuperUser}}, service};


pub async fn get_campaigns (
    State(state): State<AppState>,
    _user: AuthUser
) -> Result<impl IntoResponse, impl IntoResponse> {
    match service::campaign::get_campaigns(state.db).await {
        Ok(campaigns) => Ok((StatusCode::OK, Json(campaigns))),
        Err(e) => return Err((StatusCode::NOT_FOUND, e.to_string())),
    }
}

pub async fn get_campaign (
    State(state): State<AppState>,
    Path(campaign_id): Path<i64>,
    _user: AuthUser
) -> Result<impl IntoResponse, impl IntoResponse> {
    match service::campaign::get_campaign(campaign_id, state.db).await {
        Ok(campaigns) => Ok((StatusCode::OK, Json(campaigns))),
        Err(e) => return Err((StatusCode::NOT_FOUND, e.to_string())),
    }
}

// TODO 
pub async fn update_campaign(
    State(state): State<AppState>,
    Path(campaign_id): Path<i64>,
    _user: AuthUser,
    Json(request_body): Json<models::campaign::CampaignUpdate>,
) -> Result<impl IntoResponse, impl IntoResponse> {
    // todo!("check if user is organisation admin");
    match service::campaign::update_campaign(campaign_id, request_body, state.db).await {
        Ok(campaign) => Ok((StatusCode::OK, Json(campaign))),
        Err(e) => return Err((StatusCode::UNAUTHORIZED, e.to_string())),
    }
}

pub async fn update_campaign_banner(
    State(state): State<AppState>,
    Path(campaign_id): Path<i64>,
    _user: AuthUser,
    Json(request_body): Json<models::campaign::CampaignBannerUpdate>,
) -> Result<impl IntoResponse, impl IntoResponse> {
    // todo!("check if user is organisation admin")
    match service::campaign::update_campaign_banner(campaign_id, request_body.upload_url, state.db).await {
        Ok(campaign) => Ok((StatusCode::OK, Json(campaign))),
        Err(e) => return Err((StatusCode::UNAUTHORIZED, e.to_string())),
    }
}

pub async fn delete_campaign(
    State(state): State<AppState>,
    Path(campaign_id): Path<i64>,
    _user: SuperUser
) -> Result<impl IntoResponse, impl IntoResponse> {
    match service::campaign::delete_campaign(campaign_id, state.db).await {
        Ok(msg) => Ok((StatusCode::OK, Json(msg))),
        Err(e) => return Err((StatusCode::UNAUTHORIZED, e.to_string())),
    }
}

