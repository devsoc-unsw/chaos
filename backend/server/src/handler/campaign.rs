//! Campaign handler for the Chaos application.
//! 
//! This module provides HTTP request handlers for managing campaigns, including:
//! - Campaign CRUD operations
//! - Role management within campaigns
//! - Application management
//! - Offer management
//! - Banner image handling

use crate::models;
use crate::models::app::AppState;
use crate::models::application::Application;
use crate::models::application::NewApplication;
use crate::models::auth::AuthUser;
use crate::models::auth::CampaignAdmin;
use crate::models::campaign::{Campaign, OpenCampaign};
use crate::models::error::ChaosError;
use crate::models::offer::Offer;
use crate::models::role::{Role, RoleUpdate};
use crate::models::transaction::DBTransaction;
use axum::extract::{Json, Path, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;

/// Handler for campaign-related HTTP requests.
pub struct CampaignHandler;

impl CampaignHandler {
    /// Retrieves a campaign by its ID.
    /// 
    /// This handler allows any authenticated user to view campaign details.
    /// 
    /// # Arguments
    /// 
    /// * `transaction` - Database transaction
    /// * `id` - The ID of the campaign to retrieve
    /// * `_user` - The authenticated user
    /// 
    /// # Returns
    /// 
    /// * `Result<impl IntoResponse, ChaosError>` - Campaign details or error
    pub async fn get(
        mut transaction: DBTransaction<'_>,
        Path(id): Path<i64>,
        // no need for AuthUser as this is public
    ) -> Result<impl IntoResponse, ChaosError> {
        let campaign = Campaign::get(id, &mut transaction.tx).await?;
        transaction.tx.commit().await?;
        Ok((StatusCode::OK, Json(campaign)))
    }

    /// Retrieves a campaign by its organisation and campaign slugs.
    /// 
    /// This handler allows any authenticated user to view campaign details using slugs.
    /// 
    /// # Arguments
    /// 
    /// * `transaction` - Database transaction
    /// * `organisation_slug` - The slug of the organisation
    /// * `campaign_slug` - The slug of the campaign
    /// * `_user` - The authenticated user
    /// 
    /// # Returns
    /// 
    /// * `Result<impl IntoResponse, ChaosError>` - Campaign details or error
    pub async fn get_by_slugs(
        mut transaction: DBTransaction<'_>,
        Path((organisation_slug, campaign_slug)): Path<(String, String)>,
        _user: AuthUser,
    ) -> Result<impl IntoResponse, ChaosError> {
        let campaign =
            Campaign::get_by_slugs(organisation_slug, campaign_slug, &mut transaction.tx).await?;
        transaction.tx.commit().await?;
        Ok((StatusCode::OK, Json(campaign)))
    }

    /// Retrieves all campaigns.
    /// 
    /// This handler allows any authenticated user to view all campaigns.
    /// 
    /// # Arguments
    /// 
    /// * `transaction` - Database transaction
    /// * `_user` - The authenticated user
    /// 
    /// # Returns
    /// 
    /// * `Result<impl IntoResponse, ChaosError>` - List of campaigns or error
    pub async fn get_all(
        mut transaction: DBTransaction<'_>,
        _user: AuthUser,
    ) -> Result<impl IntoResponse, ChaosError> {
        let campaigns = Campaign::get_all(&mut transaction.tx).await?;
        transaction.tx.commit().await?;
        Ok((StatusCode::OK, Json(campaigns)))
    }

    /// Updates a campaign.
    /// 
    /// This handler allows campaign admins to update campaign details.
    /// 
    /// # Arguments
    /// 
    /// * `transaction` - Database transaction
    /// * `id` - The ID of the campaign to update
    /// * `_admin` - The authenticated user (must be a campaign admin)
    /// * `request_body` - The new campaign details
    /// 
    /// # Returns
    /// 
    /// * `Result<impl IntoResponse, ChaosError>` - Success message or error
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

    /// Updates a campaign's banner image.
    /// 
    /// This handler allows campaign admins to update the campaign's banner image.
    /// 
    /// # Arguments
    /// 
    /// * `transaction` - Database transaction
    /// * `state` - The application state
    /// * `id` - The ID of the campaign
    /// * `_admin` - The authenticated user (must be a campaign admin)
    /// 
    /// # Returns
    /// 
    /// * `Result<impl IntoResponse, ChaosError>` - Banner URL or error
    pub async fn update_banner(
        mut transaction: DBTransaction<'_>,
        State(state): State<AppState>,
        Path(id): Path<i64>,
        _admin: CampaignAdmin,
    ) -> Result<impl IntoResponse, ChaosError> {
        let banner_url =
            Campaign::update_banner(id, &mut transaction.tx, &state.storage_bucket).await?;
        transaction.tx.commit().await?;
        Ok((StatusCode::OK, Json(banner_url)))
    }

    /// Deletes a campaign.
    /// 
    /// This handler allows campaign admins to delete campaigns.
    /// 
    /// # Arguments
    /// 
    /// * `transaction` - Database transaction
    /// * `id` - The ID of the campaign to delete
    /// * `_admin` - The authenticated user (must be a campaign admin)
    /// 
    /// # Returns
    /// 
    /// * `Result<impl IntoResponse, ChaosError>` - Success message or error
    pub async fn delete(
        mut transaction: DBTransaction<'_>,
        Path(id): Path<i64>,
        _admin: CampaignAdmin,
    ) -> Result<impl IntoResponse, ChaosError> {
        Campaign::delete(id, &mut transaction.tx).await?;
        transaction.tx.commit().await?;
        Ok((StatusCode::OK, "Successfully deleted campaign"))
    }

    /// Creates a new role in a campaign.
    /// 
    /// This handler allows campaign admins to create new roles.
    /// 
    /// # Arguments
    /// 
    /// * `transaction` - Database transaction
    /// * `state` - The application state
    /// * `id` - The ID of the campaign
    /// * `_admin` - The authenticated user (must be a campaign admin)
    /// * `data` - The new role details
    /// 
    /// # Returns
    /// 
    /// * `Result<impl IntoResponse, ChaosError>` - Success message or error
    pub async fn create_role(
        mut transaction: DBTransaction<'_>,
        State(mut state): State<AppState>,
        Path(id): Path<i64>,
        _admin: CampaignAdmin,
        Json(data): Json<RoleUpdate>,
    ) -> Result<impl IntoResponse, ChaosError> {
        Role::create(id, data, &mut transaction.tx, &mut state.snowflake_generator).await?;
        transaction.tx.commit().await?;
        Ok((StatusCode::OK, "Successfully created role"))
    }

    /// Retrieves all roles in a campaign.
    /// 
    /// This handler allows any authenticated user to view all roles in a campaign.
    /// 
    /// # Arguments
    /// 
    /// * `transaction` - Database transaction
    /// * `id` - The ID of the campaign
    /// * `_user` - The authenticated user
    /// 
    /// # Returns
    /// 
    /// * `Result<impl IntoResponse, ChaosError>` - List of roles or error
    pub async fn get_roles(
        mut transaction: DBTransaction<'_>,
        Path(id): Path<i64>,
        _user: AuthUser,
    ) -> Result<impl IntoResponse, ChaosError> {
        let roles = Role::get_all_in_campaign(id, &mut transaction.tx).await?;
        transaction.tx.commit().await?;
        Ok((StatusCode::OK, Json(roles)))
    }

    /// Creates a new application for a campaign.
    /// 
    /// This handler allows authenticated users to apply to open campaigns.
    /// 
    /// # Arguments
    /// 
    /// * `state` - The application state
    /// * `id` - The ID of the campaign
    /// * `user` - The authenticated user
    /// * `_` - Ensures the campaign is open
    /// * `transaction` - Database transaction
    /// * `data` - The new application details
    /// 
    /// # Returns
    /// 
    /// * `Result<impl IntoResponse, ChaosError>` - Success message or error
    pub async fn create_application(
        State(mut state): State<AppState>,
        Path(id): Path<i64>,
        user: AuthUser,
        _: OpenCampaign,
        mut transaction: DBTransaction<'_>,
        Json(data): Json<NewApplication>,
    ) -> Result<impl IntoResponse, ChaosError> {
        Application::create(
            id,
            user.user_id,
            data,
            &mut state.snowflake_generator,
            &mut transaction.tx,
        )
        .await?;
        transaction.tx.commit().await?;
        Ok((StatusCode::OK, "Successfully created application"))
    }

    /// Retrieves all applications for a campaign.
    /// 
    /// This handler allows campaign admins to view all applications.
    /// 
    /// # Arguments
    /// 
    /// * `id` - The ID of the campaign
    /// * `_admin` - The authenticated user (must be a campaign admin)
    /// * `transaction` - Database transaction
    /// 
    /// # Returns
    /// 
    /// * `Result<impl IntoResponse, ChaosError>` - List of applications or error
    pub async fn get_applications(
        Path(id): Path<i64>,
        _admin: CampaignAdmin,
        mut transaction: DBTransaction<'_>,
    ) -> Result<impl IntoResponse, ChaosError> {
        let applications = Application::get_from_campaign_id(id, &mut transaction.tx).await?;
        transaction.tx.commit().await?;
        Ok((StatusCode::OK, Json(applications)))
    }

    /// Creates a new offer for an application.
    /// 
    /// This handler allows campaign admins to create offers for applications.
    /// 
    /// # Arguments
    /// 
    /// * `id` - The ID of the campaign
    /// * `state` - The application state
    /// * `_admin` - The authenticated user (must be a campaign admin)
    /// * `transaction` - Database transaction
    /// * `data` - The new offer details
    /// 
    /// # Returns
    /// 
    /// * `Result<impl IntoResponse, ChaosError>` - Success message or error
    pub async fn create_offer(
        Path(id): Path<i64>,
        State(mut state): State<AppState>,
        _admin: CampaignAdmin,
        mut transaction: DBTransaction<'_>,
        Json(data): Json<Offer>,
    ) -> Result<impl IntoResponse, ChaosError> {
        let _ = Offer::create(
            id,
            data.application_id,
            data.email_template_id,
            data.role_id,
            data.expiry,
            &mut transaction.tx,
            &mut state.snowflake_generator,
        )
        .await?;
        transaction.tx.commit().await?;

        Ok((StatusCode::OK, "Successfully created offer"))
    }

    /// Retrieves all offers for a campaign.
    /// 
    /// This handler allows campaign admins to view all offers.
    /// 
    /// # Arguments
    /// 
    /// * `transaction` - Database transaction
    /// * `id` - The ID of the campaign
    /// * `_user` - The authenticated user (must be a campaign admin)
    /// 
    /// # Returns
    /// 
    /// * `Result<impl IntoResponse, ChaosError>` - List of offers or error
    pub async fn get_offers(
        mut transaction: DBTransaction<'_>,
        Path(id): Path<i64>,
        _user: CampaignAdmin,
    ) -> Result<impl IntoResponse, ChaosError> {
        let offers = Offer::get_by_campaign(id, &mut transaction.tx).await?;
        transaction.tx.commit().await?;

        Ok((StatusCode::OK, Json(offers)))
    }
}
