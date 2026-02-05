//! Campaign handler for the Chaos application.
//! 
//! This module provides HTTP request handlers for managing campaigns, including:
//! - Campaign CRUD operations
//! - Role management within campaigns
//! - Application management
//! - Offer management
//! - Banner image handling

use crate::models;
use crate::models::app::{AppMessage, AppState};
use crate::models::application::Application;
use crate::models::application::NewApplication;
use crate::models::auth::AuthUser;
use crate::models::auth::CampaignAdmin;
use crate::models::campaign::{AttachmentResponse, Campaign, CampaignAttachment, NewAttachment, OpenCampaign};
use crate::models::error::ChaosError;
use crate::models::offer::Offer;
use crate::models::role::{Role, RoleUpdate};
use crate::models::storage::Storage;
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
        let campaign = Campaign::get(attachment.campaign_id, &mut transaction.tx).await?;

        if campaign.published {
            return Err(ChaosError::BadRequest);
        }

        Campaign::update(id, request_body, &mut transaction.tx).await?;
        transaction.tx.commit().await?;
        Ok(AppMessage::OkMessage("Successfully updated campaign"))
    }

    /// Publishes a campaign by setting its published field to true.
    /// 
    /// This handler allows campaign admins to publish campaigns.
    /// 
    /// # Arguments
    /// 
    /// * `transaction` - Database transaction
    /// * `id` - The ID of the campaign to publish
    /// * `_admin` - The authenticated user (must be a campaign admin)
    /// 
    /// # Returns
    /// 
    /// * `Result<impl IntoResponse, ChaosError>` - Success message or error
    pub async fn publish(
        mut transaction: DBTransaction<'_>,
        Path(id): Path<i64>,
        _admin: CampaignAdmin,
    ) -> Result<impl IntoResponse, ChaosError> {
        let campaign = Campaign::get(attachment.campaign_id, &mut transaction.tx).await?;

        if campaign.published {
            return Err(ChaosError::BadRequest);
        }
        Campaign::publish(id, &mut transaction.tx).await?;
        transaction.tx.commit().await?;
        Ok(AppMessage::OkMessage("Successfully published campaign"))
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
        let campaign = Campaign::get(attachment.campaign_id, &mut transaction.tx).await?;

        if campaign.published {
            return Err(ChaosError::BadRequest);
        }

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
        let campaign = Campaign::get(attachment.campaign_id, &mut transaction.tx).await?;

        if campaign.published {
            return Err(ChaosError::BadRequest);
        }

        Campaign::delete(id, &mut transaction.tx).await?;
        transaction.tx.commit().await?;
        Ok(AppMessage::OkMessage("Successfully deleted campaign"))
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
        let campaign = Campaign::get(attachment.campaign_id, &mut transaction.tx).await?;

        if campaign.published {
            return Err(ChaosError::BadRequest);
        }

        Role::create(id, data, &mut transaction.tx, &mut state.snowflake_generator).await?;
        transaction.tx.commit().await?;
        Ok(AppMessage::OkMessage("Successfully created role"))
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
        Ok(AppMessage::OkMessage("Successfully created application"))
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
        admin: CampaignAdmin,
        mut transaction: DBTransaction<'_>,
    ) -> Result<impl IntoResponse, ChaosError> {
        let applications = Application::get_from_campaign_id(id, admin.user_id, &mut transaction.tx).await?;
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

        Ok(AppMessage::OkMessage("Successfully created offer"))
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

    /// Retrieves the attachments for a campaign.
    /// 
    /// This handler allows any authenticated user to view the attachments.
    /// Returns an empty list if no documents exist.
    /// 
    /// # Arguments
    /// 
    /// * `transaction` - Database transaction
    /// * `state` - The application state
    /// * `id` - The ID of the campaign
    /// * `_user` - The authenticated user
    /// 
    /// # Returns
    /// 
    /// * `Result<impl IntoResponse, ChaosError>` - List of attachments with download URLs
    pub async fn get_attachments(
        mut transaction: DBTransaction<'_>,
        State(state): State<AppState>,
        Path(id): Path<i64>,
        _user: AuthUser,
    ) -> Result<impl IntoResponse, ChaosError> {
        let campaign = Campaign::get(id, &mut transaction.tx).await?;
        let attachments = CampaignAttachment::get_by_campaign(id, &mut transaction.tx).await?;

        // Generate download URLs for each attachment
        let mut responses = Vec::new();
        for attachment in attachments {
            let download_url = Storage::generate_get_url(
                format!("/organisation/{}/campaign/{}/attachment/{}", campaign.organisation_id, campaign.id, attachment.id),
                &state.storage_bucket,
            )
            .await?;

            responses.push(AttachmentResponse {
                id: attachment.id,
                campaign_id: attachment.campaign_id,
                file_name: attachment.file_name,
                file_size: attachment.file_size,
                download_url,
            });
        }

        transaction.tx.commit().await?;
        Ok((StatusCode::OK, Json(responses)))
    }

    /// Creates or updates an attachment for a campaign.
    /// 
    /// This handler allows campaign admins to upload role documents.
    /// It generates a pre-signed URL for uploading the file to S3.
    /// 
    /// # Arguments
    /// 
    /// * `transaction` - Database transaction
    /// * `state` - The application state
    /// * `id` - The ID of the campaign
    /// * `_admin` - The authenticated user (must be a campaign admin)
    /// * `data` - The file metadata (name and size)
    /// 
    /// # Returns
    /// 
    /// * `Result<impl IntoResponse, ChaosError>` - Upload URL and attachment ID
    pub async fn upload_attachments(
        mut transaction: DBTransaction<'_>,
        State(mut state): State<AppState>,
        Path(id): Path<i64>,
        _admin: CampaignAdmin,
        Json(data): Json<Vec<NewAttachment>>,
    ) -> Result<impl IntoResponse, ChaosError> {
        let campaign = Campaign::get(attachment.campaign_id, &mut transaction.tx).await?;

        if campaign.published {
            return Err(ChaosError::BadRequest);
        }

        let upload_results = CampaignAttachment::create_or_update_multiple(id, data, &mut transaction.tx, &mut state.snowflake_generator, &state.storage_bucket).await?;
        transaction.tx.commit().await?;
        Ok((StatusCode::OK, Json(upload_results)))
    }

    /// Deletes an attachment.
    /// 
    /// This handler allows campaign admins to delete attachments.
    /// 
    /// # Arguments
    /// 
    /// * `transaction` - Database transaction
    /// * `attachment_id` - The ID of the attachment to delete
    /// * `_admin` - The authenticated user (must be a campaign admin)
    /// 
    /// # Returns
    /// 
    /// * `Result<impl IntoResponse, ChaosError>` - Success message or error
    /// Deletes an attachment.
    /// 
    /// This handler allows campaign admins to delete attachments.
    /// Verifies that the admin has access to the campaign the attachment belongs to.
    /// 
    /// # Arguments
    /// 
    /// * `transaction` - Database transaction
    /// * `attachment_id` - The ID of the attachment to delete
    /// * `admin` - The authenticated user (must be a campaign admin)
    /// 
    /// # Returns
    /// 
    /// * `Result<impl IntoResponse, ChaosError>` - Success message or error
    pub async fn delete_attachment(
        mut transaction: DBTransaction<'_>,
        State(state): State<AppState>,
        Path(attachment_id): Path<i64>,
        user: AuthUser,
    ) -> Result<impl IntoResponse, ChaosError> {
        // Get the attachment to find its campaign_id
        let attachment = CampaignAttachment::get_by_id(attachment_id, &mut transaction.tx).await?;
        let campaign = Campaign::get(attachment.campaign_id, &mut transaction.tx).await?;

        if campaign.published {
            return Err(ChaosError::BadRequest);
        }

        // Verify the admin has access to this campaign
        crate::service::campaign::user_is_campaign_admin(
            user.user_id,
            attachment.campaign_id,
            &mut transaction.tx,
        )
        .await?;
        
        // Delete the attachment from database
        CampaignAttachment::delete(attachment_id, &mut transaction.tx).await?;

        // Delete the file from S3 storage
        let storage_path = format!("/organisation/{}/campaign/{}/attachment/{}", campaign.organisation_id, campaign.id, attachment.id);
        Storage::delete_file(storage_path, &state.storage_bucket).await?;
        
        transaction.tx.commit().await?;
        Ok(())
    }
}
