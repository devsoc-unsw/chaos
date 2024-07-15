use crate::models;
use crate::models::app::AppState;
use crate::models::auth::SuperUser;
use crate::models::auth::{AuthUser, OrganisationAdmin};
use crate::models::error::ChaosError;
use crate::models::campaign::{Campaign, CampaignBannerUpdate, CampaignUpdate};
use crate::models::transaction::DBTransaction;
use axum::extract::{Json, Path, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;

pub struct CampaignHandler;
impl CampaignHandler {
    pub async fn get(
        State(state): State<AppState>,
        Path(id): Path<i64>,
        _user: AuthUser,
    ) -> Result<impl IntoResponse, ChaosError> {
        let campaign = Campaign::get(id, &state.db).await?;
        Ok((StatusCode::OK, Json(campaign)))
    }
    // TODO
    pub async fn update(
        State(state): State<AppState>,
        Path(id): Path<i64>,
        _admin: OrganisationAdmin,
        Json(request_body): Json<models::campaign::CampaignUpdate>,
    ) -> Result<impl IntoResponse, ChaosError> {
        Campaign::update(id, request_body, &state.db).await?;
        Ok((StatusCode::OK, "Successfully updated campaign"))
    }


    pub async fn update_banner(
        State(state): State<AppState>,
        Path(id): Path<i64>,
        _admin: OrganisationAdmin,
    ) -> Result<impl IntoResponse, ChaosError> {
        let banner_url = Campaign::update_banner(id, &state.db, &state.storage_bucket).await?;
        Ok((StatusCode::OK, Json(banner_url)))
    }

    pub async fn delete(
        State(state): State<AppState>,
        Path(id): Path<i64>,
        _user: SuperUser,
    ) -> Result<impl IntoResponse, ChaosError> {
        // todo!("check if user is organisation admin")?
        Campaign::delete(id, &state.db).await?;
        Ok((StatusCode::OK, "Successfully deleted campaign"))

    }


}
