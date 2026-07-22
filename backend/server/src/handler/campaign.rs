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
use crate::models::campaign::{
    AttachmentResponse, Campaign, CampaignAttachment, CampaignDetailsResponse, NewAttachment,
    OpenCampaign,
};
use crate::models::error::ChaosError;
use crate::models::offer::Offer;
use crate::models::role::{Role, RoleUpdate};
use crate::models::storage::Storage;
use crate::models::transaction::DBTransaction;
use crate::spicedb::{policies::ManageCampaign, SpiceDbAuth};
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
        State(state): State<AppState>,
        Path(id): Path<i64>,
        // no need for AuthUser as this is public
    ) -> Result<impl IntoResponse, ChaosError> {
        let campaign = Campaign::get(id, &mut transaction.tx).await?;
        let cover_image_url = Campaign::cover_image_presigned_get_url(
            id,
            campaign.cover_image,
            &state.storage_bucket,
        )
        .await?;
        transaction.tx.commit().await?;
        Ok((
            StatusCode::OK,
            Json(CampaignDetailsResponse {
                campaign,
                cover_image_url,
            }),
        ))
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
        State(state): State<AppState>,
        Path((organisation_slug, campaign_slug)): Path<(String, String)>,
    ) -> Result<impl IntoResponse, ChaosError> {
        let campaign =
            Campaign::get_by_slugs(organisation_slug, campaign_slug, true, &mut transaction.tx)
                .await?;

        let cover_image_url = Campaign::cover_image_presigned_get_url(
            campaign.id,
            campaign.cover_image,
            &state.storage_bucket,
        )
        .await?;

        transaction.tx.commit().await?;
        Ok((
            StatusCode::OK,
            Json(CampaignDetailsResponse {
                campaign,
                cover_image_url,
            }),
        ))
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
    /// * `auth` - The authenticated user, authorized to manage the campaign
    ///   identified by the `campaign_id` path parameter
    /// * `transaction` - Database transaction
    /// * `request_body` - The new campaign details
    ///
    /// # Returns
    ///
    /// * `Result<impl IntoResponse, ChaosError>` - Success message or error
    pub async fn update(
        auth: SpiceDbAuth<ManageCampaign>,
        mut transaction: DBTransaction<'_>,
        Json(request_body): Json<models::campaign::CampaignUpdate>,
    ) -> Result<impl IntoResponse, ChaosError> {
        Campaign::update(auth.resource_id, request_body, &mut transaction.tx).await?;
        transaction.tx.commit().await?;
        Ok(AppMessage::OkMessage("Successfully updated campaign"))
    }

    /// Publishes a campaign by setting its published field to true.
    ///
    /// This handler allows campaign admins to publish campaigns.
    ///
    /// # Arguments
    ///
    /// * `auth` - The authenticated user, authorized to manage the campaign
    ///   identified by the `campaign_id` path parameter
    /// * `transaction` - Database transaction
    ///
    /// # Returns
    ///
    /// * `Result<impl IntoResponse, ChaosError>` - Success message or error
    pub async fn publish(
        auth: SpiceDbAuth<ManageCampaign>,
        mut transaction: DBTransaction<'_>,
    ) -> Result<impl IntoResponse, ChaosError> {
        Campaign::publish(auth.resource_id, &mut transaction.tx).await?;
        transaction.tx.commit().await?;
        Ok(AppMessage::OkMessage("Successfully published campaign"))
    }

    /// Updates a campaign's banner image.
    ///
    /// This handler allows campaign admins to update the campaign's banner image.
    ///
    /// # Arguments
    ///
    /// * `auth` - The authenticated user, authorized to manage the campaign
    ///   identified by the `campaign_id` path parameter
    /// * `transaction` - Database transaction
    /// * `state` - The application state
    ///
    /// # Returns
    ///
    /// * `Result<impl IntoResponse, ChaosError>` - Banner URL or error
    pub async fn update_banner(
        auth: SpiceDbAuth<ManageCampaign>,
        mut transaction: DBTransaction<'_>,
        State(state): State<AppState>,
    ) -> Result<impl IntoResponse, ChaosError> {
        let banner_url =
            Campaign::update_banner(auth.resource_id, &mut transaction.tx, &state.storage_bucket)
                .await?;
        transaction.tx.commit().await?;
        Ok((StatusCode::OK, Json(banner_url)))
    }

    /// Deletes a campaign.
    ///
    /// This handler allows campaign admins to delete campaigns.
    ///
    /// # Arguments
    ///
    /// * `auth` - The authenticated user, authorized to manage the campaign
    ///   identified by the `campaign_id` path parameter
    /// * `transaction` - Database transaction
    ///
    /// # Returns
    ///
    /// * `Result<impl IntoResponse, ChaosError>` - Success message or error
    pub async fn delete(
        auth: SpiceDbAuth<ManageCampaign>,
        mut transaction: DBTransaction<'_>,
    ) -> Result<impl IntoResponse, ChaosError> {
        Campaign::delete(auth.resource_id, &mut transaction.tx).await?;
        transaction.tx.commit().await?;
        Ok(AppMessage::OkMessage("Successfully deleted campaign"))
    }

    /// Creates a new role in a campaign.
    ///
    /// This handler allows campaign admins to create new roles.
    ///
    /// # Arguments
    ///
    /// * `auth` - The authenticated user, authorized to manage the campaign
    ///   identified by the `campaign_id` path parameter
    /// * `transaction` - Database transaction
    /// * `state` - The application state
    /// * `data` - The new role details
    ///
    /// # Returns
    ///
    /// * `Result<impl IntoResponse, ChaosError>` - Success message or error
    pub async fn create_role(
        auth: SpiceDbAuth<ManageCampaign>,
        mut transaction: DBTransaction<'_>,
        State(mut state): State<AppState>,
        Json(data): Json<RoleUpdate>,
    ) -> Result<impl IntoResponse, ChaosError> {
        Campaign::create_role(
            auth.resource_id,
            data,
            &mut transaction.tx,
            &mut state.snowflake_generator,
        )
        .await?;
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
    /// * `auth` - The authenticated user, authorized to manage the campaign
    ///   identified by the `campaign_id` path parameter
    /// * `transaction` - Database transaction
    ///
    /// # Returns
    ///
    /// * `Result<impl IntoResponse, ChaosError>` - List of applications or error
    pub async fn get_applications(
        auth: SpiceDbAuth<ManageCampaign>,
        mut transaction: DBTransaction<'_>,
    ) -> Result<impl IntoResponse, ChaosError> {
        let applications =
            Application::get_from_campaign_id(auth.resource_id, auth.user_id, &mut transaction.tx)
                .await?;
        transaction.tx.commit().await?;
        Ok((StatusCode::OK, Json(applications)))
    }

    /// Creates a new offer for an application.
    ///
    /// This handler allows campaign admins to create offers for applications.
    ///
    /// # Arguments
    ///
    /// * `auth` - The authenticated user, authorized to manage the campaign
    ///   identified by the `campaign_id` path parameter
    /// * `state` - The application state
    /// * `transaction` - Database transaction
    /// * `data` - The new offer details
    ///
    /// # Returns
    ///
    /// * `Result<impl IntoResponse, ChaosError>` - Success message or error
    pub async fn create_offer(
        auth: SpiceDbAuth<ManageCampaign>,
        State(mut state): State<AppState>,
        mut transaction: DBTransaction<'_>,
        Json(data): Json<Offer>,
    ) -> Result<impl IntoResponse, ChaosError> {
        let _ = Offer::create(
            auth.resource_id,
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
    /// * `auth` - The authenticated user, authorized to manage the campaign
    ///   identified by the `campaign_id` path parameter
    /// * `transaction` - Database transaction
    ///
    /// # Returns
    ///
    /// * `Result<impl IntoResponse, ChaosError>` - List of offers or error
    pub async fn get_offers(
        auth: SpiceDbAuth<ManageCampaign>,
        mut transaction: DBTransaction<'_>,
    ) -> Result<impl IntoResponse, ChaosError> {
        let offers = Offer::get_by_campaign(auth.resource_id, &mut transaction.tx).await?;
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
                format!(
                    "/organisation/{}/campaign/{}/attachment/{}",
                    campaign.organisation_id, campaign.id, attachment.id
                ),
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
    /// * `auth` - The authenticated user, authorized to manage the campaign
    ///   identified by the `campaign_id` path parameter
    /// * `transaction` - Database transaction
    /// * `state` - The application state
    /// * `data` - The file metadata (name and size)
    ///
    /// # Returns
    ///
    /// * `Result<impl IntoResponse, ChaosError>` - Upload URL and attachment ID
    pub async fn upload_attachments(
        auth: SpiceDbAuth<ManageCampaign>,
        mut transaction: DBTransaction<'_>,
        State(mut state): State<AppState>,
        Json(data): Json<Vec<NewAttachment>>,
    ) -> Result<impl IntoResponse, ChaosError> {
        let upload_results = CampaignAttachment::create_or_update_multiple(
            auth.resource_id,
            data,
            &mut transaction.tx,
            &mut state.snowflake_generator,
            &state.storage_bucket,
        )
        .await?;
        transaction.tx.commit().await?;
        Ok((StatusCode::OK, Json(upload_results)))
    }

    /// Deletes an attachment.
    ///
    /// This handler allows campaign admins to delete attachments.
    ///
    /// # Arguments
    ///
    /// * `_auth` - The authenticated user, authorized to manage the campaign
    ///   identified by the `campaign_id` path parameter
    /// * `transaction` - Database transaction
    /// * `state` - The application state
    /// * `campaign_id` - The ID of the campaign owning the attachment
    /// * `attachment_id` - The ID of the attachment to delete
    ///
    /// # Returns
    ///
    /// * `Result<impl IntoResponse, ChaosError>` - Success message or error
    pub async fn delete_attachment(
        _auth: SpiceDbAuth<ManageCampaign>,
        mut transaction: DBTransaction<'_>,
        State(state): State<AppState>,
        Path((campaign_id, attachment_id)): Path<(i64, i64)>,
    ) -> Result<impl IntoResponse, ChaosError> {
        let attachment = CampaignAttachment::get_by_id(attachment_id, &mut transaction.tx).await?;

        // Ensure the attachment actually belongs to the campaign in the path
        if attachment.campaign_id != campaign_id {
            return Err(ChaosError::BadRequest);
        }

        let (organisation_id, campaign_id) =
            CampaignAttachment::delete(attachment_id, &mut transaction.tx).await?;

        // Delete the file from S3 storage
        let storage_path = format!(
            "/organisation/{}/campaign/{}/attachment/{}",
            organisation_id, campaign_id, attachment.id
        );
        Storage::delete_file(storage_path, &state.storage_bucket).await?;

        transaction.tx.commit().await?;
        Ok(())
    }
}
