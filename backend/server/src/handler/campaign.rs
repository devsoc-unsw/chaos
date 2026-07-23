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
use crate::models::campaign::{
    AttachmentResponse, Campaign, CampaignAttachment, CampaignDetailsResponse, NewAttachment,
    OpenCampaign,
};
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
        Campaign::create_role(
            id,
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
        let applications =
            Application::get_from_campaign_id(id, admin.user_id, &mut transaction.tx).await?;
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
        let upload_results = CampaignAttachment::create_or_update_multiple(
            id,
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
    /// * `transaction` - Database transaction
    /// * `attachment_id` - The ID of the attachment to delete
    /// * `_admin` - The authenticated user (must be a campaign admin)
    ///
    /// # Returns
    ///
    /// * `Result<impl IntoResponse, ChaosError>` - Success message or error
    pub async fn delete_attachment(
        mut transaction: DBTransaction<'_>,
        State(state): State<AppState>,
        Path((campaign_id, attachment_id)): Path<(i64, i64)>,
        _admin: CampaignAdmin,
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

#[cfg(test)]
mod tests {
    // =========================================================================
    // TEST PLAN – HTTP integration (handler + extractors + auth + DB)
    // =========================================================================
    //
    // Handlers driven through the real Router via oneshot against a #[sqlx::test] DB:
    //   · GET   /api/v1/campaigns              -> get_all (AuthUser)
    //   · PATCH /api/v1/campaign/:id/publish   -> publish (CampaignAdmin)
    //
    //  ID    Scenario                       Expected                          Test
    //  EP01  list, no auth cookie           401                               get_all_requires_authentication
    //  EP02  list as authed user            200 + campaigns array             get_all_returns_campaigns
    //  EP03  publish as campaign admin      200 + published = true            admin_can_publish
    //  EP04  publish as non-admin           403 + still unpublished           non_admin_cannot_publish
    //
    // KNOWN GAPS: attachment upload/delete and banner/logo handlers use S3
    // (Storage) which the inert bucket stub cannot serve; create_role runs
    // RoleUpdate::validate (env-driven, covered at the model layer). None are
    // driven here.
    // =========================================================================

    use super::*;
    use crate::test_support::*;
    use axum::http::StatusCode;
    use axum::routing::{get, patch};
    use axum::Router;
    use sqlx::PgPool;
    use tower::ServiceExt;

    fn router(pool: PgPool) -> Router {
        Router::new()
            .route("/api/v1/campaigns", get(CampaignHandler::get_all))
            .route(
                "/api/v1/campaign/:campaign_id/publish",
                patch(CampaignHandler::publish),
            )
            .with_state(test_state(pool))
    }

    async fn is_published(pool: &PgPool) -> bool {
        sqlx::query_scalar("SELECT published FROM campaigns WHERE id = 1")
            .fetch_one(pool)
            .await
            .unwrap()
    }

    /// White-box: listing campaigns requires authentication.
    #[sqlx::test(migrations = "../migrations")]
    async fn get_all_requires_authentication(pool: PgPool) {
        seed_user(&pool, 1, "u@test.com").await;
        seed_org(&pool, 1, "org").await;
        seed_campaign(&pool, 1, 1, true).await;

        let response = router(pool.clone())
            .oneshot(request("GET", "/api/v1/campaigns", None, None))
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
    }

    /// White-box: an authed user gets the campaign list.
    #[sqlx::test(migrations = "../migrations")]
    async fn get_all_returns_campaigns(pool: PgPool) {
        seed_user(&pool, 1, "u@test.com").await;
        seed_org(&pool, 1, "org").await;
        seed_campaign(&pool, 1, 1, true).await;

        let response = router(pool.clone())
            .oneshot(request("GET", "/api/v1/campaigns", Some(1), None))
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
        let json = body_json(response).await;
        assert!(
            !json.as_array().expect("array").is_empty(),
            "the seeded campaign should be listed"
        );
    }

    /// White-box: a campaign admin publishes the campaign.
    #[sqlx::test(migrations = "../migrations")]
    async fn admin_can_publish(pool: PgPool) {
        seed_user(&pool, 2, "admin@test.com").await;
        seed_org(&pool, 1, "org").await;
        seed_org_member(&pool, 1, 2, "Admin").await;
        seed_campaign(&pool, 1, 1, false).await; // published = false

        let response = router(pool.clone())
            .oneshot(request("PATCH", "/api/v1/campaign/1/publish", Some(2), None))
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
        assert!(is_published(&pool).await, "campaign should be published");
    }

    /// White-box: a non-admin cannot publish; the campaign stays unpublished.
    #[sqlx::test(migrations = "../migrations")]
    async fn non_admin_cannot_publish(pool: PgPool) {
        seed_user(&pool, 1, "u@test.com").await;
        seed_org(&pool, 1, "org").await;
        seed_campaign(&pool, 1, 1, false).await;

        let response = router(pool.clone())
            .oneshot(request("PATCH", "/api/v1/campaign/1/publish", Some(1), None))
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::FORBIDDEN);
        assert!(!is_published(&pool).await, "campaign must stay unpublished");
    }
}
