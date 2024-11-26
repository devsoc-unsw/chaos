use crate::models;
use crate::models::app::AppState;
use crate::models::application::Application;
use crate::models::application::NewApplication;
use crate::models::auth::AuthUser;
use crate::models::auth::CampaignAdmin;
use crate::models::campaign::Campaign;
use crate::models::error::ChaosError;
use crate::models::role::{Role, RoleUpdate};
use crate::models::transaction::DBTransaction;
use axum::extract::{Json, Path, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;

pub struct CampaignHandler;
impl CampaignHandler {
    pub async fn get(
        mut transaction: DBTransaction<'_>,
        Path(id): Path<i64>,
        _user: AuthUser,
    ) -> Result<impl IntoResponse, ChaosError> {
        let campaign = Campaign::get(id, &mut transaction.tx).await?;
        transaction.tx.commit().await?;
        Ok((StatusCode::OK, Json(campaign)))
    }

    pub async fn get_by_slugs(
        mut transaction: DBTransaction<'_>,
        Path((organisation_slug, campaign_slug)): Path<(String, String)>,
        _user: AuthUser,
    ) -> Result<impl IntoResponse, ChaosError> {
        let campaign = Campaign::get_by_slugs(organisation_slug, campaign_slug, &mut transaction.tx).await?;
        transaction.tx.commit().await?;
        Ok((StatusCode::OK, Json(campaign)))
    }

    pub async fn get_all(
        mut transaction: DBTransaction<'_>,
        _user: AuthUser,
    ) -> Result<impl IntoResponse, ChaosError> {
        let campaigns = Campaign::get_all(&mut transaction.tx).await?;
        transaction.tx.commit().await?;
        Ok((StatusCode::OK, Json(campaigns)))
    }

    pub async fn update(
        mut transaction: DBTransaction<'_>,
        Path(id): Path<i64>,
        _admin: CampaignAdmin,
        Json(request_body): Json<models::campaign::CampaignUpdate>,
    ) -> Result<impl IntoResponse, ChaosError> {
        Campaign::update(id, request_body, &mut transaction.tx).await?;
        transaction.tx.commit().await?;
        Ok((StatusCode::OK, "Successfully updated campaign"))
    }

    pub async fn update_banner(
        mut transaction: DBTransaction<'_>,
        State(state): State<AppState>,
        Path(id): Path<i64>,
        _admin: CampaignAdmin,
    ) -> Result<impl IntoResponse, ChaosError> {
        let banner_url = Campaign::update_banner(id, &mut transaction.tx, &state.storage_bucket).await?;
        transaction.tx.commit().await?;
        Ok((StatusCode::OK, Json(banner_url)))
    }

    pub async fn delete(
        mut transaction: DBTransaction<'_>,
        Path(id): Path<i64>,
        _admin: CampaignAdmin,
    ) -> Result<impl IntoResponse, ChaosError> {
        Campaign::delete(id, &mut transaction.tx).await?;
        transaction.tx.commit().await?;
        Ok((StatusCode::OK, "Successfully deleted campaign"))
    }

    pub async fn create_role(
        mut transaction: DBTransaction<'_>,
        State(state): State<AppState>,
        Path(id): Path<i64>,
        _admin: CampaignAdmin,
        Json(data): Json<RoleUpdate>,
    ) -> Result<impl IntoResponse, ChaosError> {
        Role::create(id, data, &mut transaction.tx, state.snowflake_generator).await?;
        transaction.tx.commit().await?;
        Ok((StatusCode::OK, "Successfully created role"))
    }

    pub async fn get_roles(
        mut transaction: DBTransaction<'_>,
        Path(id): Path<i64>,
        _user: AuthUser,
    ) -> Result<impl IntoResponse, ChaosError> {
        let roles = Role::get_all_in_campaign(id, &mut transaction.tx).await?;
        transaction.tx.commit().await?;
        Ok((StatusCode::OK, Json(roles)))
    }

    pub async fn create_application(
        State(state): State<AppState>,
        Path(id): Path<i64>,
        user: AuthUser,
        mut transaction: DBTransaction<'_>,
        Json(data): Json<NewApplication>,
    ) -> Result<impl IntoResponse, ChaosError> {
        Application::create(
            id,
            user.user_id,
            data,
            state.snowflake_generator,
            &mut transaction.tx,
        )
        .await?;
        transaction.tx.commit().await?;
        Ok((StatusCode::OK, "Successfully created application"))
    }

    pub async fn get_applications(
        Path(id): Path<i64>,
        _admin: CampaignAdmin,
        mut transaction: DBTransaction<'_>,
    ) -> Result<impl IntoResponse, ChaosError> {
        let applications = Application::get_from_campaign_id(id, &mut transaction.tx).await?;
        transaction.tx.commit().await?;
        Ok((StatusCode::OK, Json(applications)))
    }
}
