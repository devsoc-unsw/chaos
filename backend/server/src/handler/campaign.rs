use axum::extract::{Path, State, Json};


pub async fn get_campaigns (
    State(state): State<AppState>,
    _user: AuthUser
) -> Result<impl IntoResponse, impl IntoResponse> {
    match service::campaign::get_campaigns(state.db).await {
        Ok(campaigns) => Ok((StatusCode::OK, Json(campaigns))),
        Err(e) => return Err((StatusCode::NOT_FOUND, e.to_string())),
    }
}


pub async fn update_campaign(
    State(state): State<AppState>,
    Path(campaign_id): Path<i64>,
    _user: AuthUser,
    Json(request_body): Json<models::campaign::CampaignUpdate>,
) -> Result<impl IntoResponse, impl IntoResponse> {
    match service::campaign::update_campaign(campaign_id, state.db).await {
        Ok(campaign) => Ok((StatusCode::OK, Json(campaign))),
        Err(e) => return Err((StatusCode::NOT_FOUND, e.to_string())),
    }
}

pub async fn get_all_campaigns(
    State(state): State<AppState>,
    _user: AuthUser,
) -> Result<impl IntoResponse, impl IntoResponse> {
    let mut all_campaigns = CampaignList{};
    if let Ok(published) = service::campaign::get_public_campaigns(state.db).await {
        campaign.published_campaigns = published;
    } else {
        return Err((StatusCode::NOT_FOUND, e.to_string()));    
    }
    if let Ok(unpublished) = service::campaign::get_private_campaigns(state.db).await {
        campaign.unpublished_campaigns = published;
    } else {
        return Err((StatusCode::NOT_FOUND, e.to_string()));    
    }
    Ok((StatusCode::OK, Json(all_campaigns)))
}