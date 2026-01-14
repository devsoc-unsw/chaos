//! Campaign management module for the Chaos application.
//! 
//! This module provides functionality for managing recruitment campaigns,
//! including creation, updates, and retrieval of campaign information.
//! It also handles campaign banner management and campaign status tracking.

use chrono::{DateTime, Utc};
use s3::Bucket;
use serde::{Deserialize, Serialize};
use sqlx::{FromRow, Transaction};
use sqlx::{Postgres};
use std::ops::DerefMut;
use axum::{async_trait, RequestPartsExt};
use axum::extract::{FromRef, FromRequestParts, Path};
use axum::http::request::Parts;
use uuid::Uuid;
use crate::models::app::AppState;
use crate::service::campaign::{assert_campaign_is_open, create_proper_slug};
use super::{error::ChaosError, storage::Storage};
use snowflake::SnowflakeIdGenerator;
use std::env;

/// Represents a campaign in the system.
/// 
/// A campaign is a recruitment drive organized by an organization, with a specific
/// time period and set of roles to fill.
#[derive(Deserialize, Serialize, Clone, FromRow, Debug)]
pub struct Campaign {
    /// Unique identifier for the campaign
    #[serde(serialize_with = "crate::models::serde_string::serialize")]
    pub id: i64,
    /// URL-friendly identifier for the campaign
    pub slug: String,
    /// Display name of the campaign
    pub name: String,
    /// ID of the organization running the campaign
    #[serde(serialize_with = "crate::models::serde_string::serialize")]
    pub organisation_id: i64,
    /// URL-friendly identifier for the organization
    pub organisation_slug: String,
    /// Name of the organization running the campaign
    pub organisation_name: String,
    /// Optional UUID of the campaign's cover image
    pub cover_image: Option<Uuid>,
    /// Optional description of the campaign
    pub description: Option<String>,
    /// When the campaign starts accepting applications
    pub starts_at: DateTime<Utc>,
    /// When the campaign stops accepting applications
    pub ends_at: DateTime<Utc>,
    /// When the campaign was created
    pub created_at: DateTime<Utc>,
    /// When the campaign was last updated
    pub updated_at: DateTime<Utc>,
    /// When interview period begins
    pub interview_period_starts_at: Option<DateTime<Utc>>,
    /// When interview period ends
    pub interview_period_ends_at: Option<DateTime<Utc>>,
    /// Interview format (e.g., "in-person", "online", "hybrid")
    pub interview_format: Option<String>,
    /// When applicants will be notified of outcomes
    pub outcomes_released_at: Option<DateTime<Utc>>,
    /// Additional application requirements (e.g., "Resume required", "No economics background needed")
    pub application_requirements: Option<String>,
    /// Whether the campaign is published
    pub published: bool,
    /// Max amount of roles an applicant can apply for
    pub max_roles_per_application: Option<i32>
}

/// Detailed view of a campaign.
/// 
/// Contains additional information about the campaign and its organization.
#[derive(Deserialize, Serialize, Clone, FromRow, Debug)]
pub struct CampaignDetails {
    /// Unique identifier for the campaign
    #[serde(serialize_with = "crate::models::serde_string::serialize")]
    pub id: i64,
    /// URL-friendly identifier for the campaign
    pub campaign_slug: String,
    /// Display name of the campaign
    pub name: String,
    /// ID of the organization running the campaign
    #[serde(serialize_with = "crate::models::serde_string::serialize")]
    pub organisation_id: i64,
    /// URL-friendly identifier for the organization
    pub organisation_slug: String,
    /// Name of the organization running the campaign
    pub organisation_name: String,
    /// The organisation's contact email (e.g. contact@devsoc.app)
    pub contact_email: String,
    /// The organisations website link (e.g. https://devsoc.app)
    pub website_url: Option<String>,
    /// Optional UUID of the campaign's cover image
    pub cover_image: Option<Uuid>,
    /// Optional description of the campaign
    pub description: Option<String>,
    /// When the campaign starts accepting applications
    pub starts_at: DateTime<Utc>,
    /// When the campaign stops accepting applications
    pub ends_at: DateTime<Utc>,
    /// When interview period begins
    pub interview_period_starts_at: Option<DateTime<Utc>>,
    /// When interview period ends
    pub interview_period_ends_at: Option<DateTime<Utc>>,
    /// Interview format (e.g., "in-person", "online", "hybrid")
    pub interview_format: Option<String>,
    /// When applicants will be notified of outcomes
    pub outcomes_released_at: Option<DateTime<Utc>>,
    /// Additional application requirements (e.g., "Resume required", "No economics background needed")
    pub application_requirements: Option<String>,
    /// Whether the campaign is published
    pub published: bool,
    /// Max amount of roles an applicant can apply for
    pub max_roles_per_application: Option<i32>
}

/// Simplified view of a campaign for organization listings.
/// 
/// Contains only the essential information needed when displaying campaigns
/// within an organization's context.
#[derive(Deserialize, Serialize, Clone, FromRow, Debug)]
pub struct OrganisationCampaign {
    /// Unique identifier for the campaign
    #[serde(serialize_with = "crate::models::serde_string::serialize")]
    pub id: i64,
    /// ID of the organization running the campaign
    #[serde(serialize_with = "crate::models::serde_string::serialize")]
    pub organisation_id: i64,
    /// URL-friendly identifier for the campaign
    pub campaign_slug: String,
    /// URL-friendly identifier for the organization
    pub organisation_slug: String,
    /// Display name of the campaign
    pub name: String,
    /// Optional UUID of the campaign's cover image
    pub cover_image: Option<Uuid>,
    /// Optional description of the campaign
    pub description: Option<String>,
    /// When the campaign starts accepting applications
    pub starts_at: DateTime<Utc>,
    /// When the campaign stops accepting applications
    pub ends_at: DateTime<Utc>,
    /// Whether the campaign is published
    pub published: bool,
    /// When interview period begins
    pub interview_period_starts_at: Option<DateTime<Utc>>,
    /// When interview period ends
    pub interview_period_ends_at: Option<DateTime<Utc>>,
    /// Interview format (e.g., "in-person", "online", "hybrid")
    pub interview_format: Option<String>,
    /// When applicants will be notified of outcomes
    pub outcomes_released_at: Option<DateTime<Utc>>,
    /// Additional application requirements (e.g., "Resume required", "No economics background needed")
    pub application_requirements: Option<String>,
}

/// Data structure for creating a new campaign.
/// 
/// Contains all the information needed to create a new campaign.
#[derive(Deserialize)]
pub struct NewCampaign {
    /// URL-friendly identifier for the campaign
    pub slug: String,
    /// Display name of the campaign
    pub name: String,
    /// Optional description of the campaign
    pub description: Option<String>,
    /// When the campaign starts accepting applications
    pub starts_at: DateTime<Utc>,
    /// When the campaign stops accepting applications
    pub ends_at: DateTime<Utc>,
    /// When interview period begins
    pub interview_period_starts_at: Option<DateTime<Utc>>,
    /// When interview period ends
    pub interview_period_ends_at: Option<DateTime<Utc>>,
    /// Interview format (e.g., "in-person", "online", "hybrid")
    pub interview_format: Option<String>,
    /// When applicants will be notified of outcomes
    pub outcomes_released_at: Option<DateTime<Utc>>,
    /// Additional application requirements (e.g., "Resume required", "No economics background needed")
    pub application_requirements: Option<String>,
}

/// Data structure for updating an existing campaign.
/// 
/// Contains all the fields that can be updated for a campaign.
#[derive(Deserialize, Serialize, Clone, FromRow, Debug)]
pub struct CampaignUpdate {
    /// URL-friendly identifier for the campaign
    pub slug: String,
    /// Display name of the campaign
    pub name: String,
    /// Description of the campaign
    pub description: String,
    /// When the campaign starts accepting applications
    pub starts_at: DateTime<Utc>,
    /// When the campaign stops accepting applications
    pub ends_at: DateTime<Utc>,
    /// When interview period begins
    pub interview_period_starts_at: Option<DateTime<Utc>>,
    /// When interview period ends
    pub interview_period_ends_at: Option<DateTime<Utc>>,
    /// Interview format (e.g., "in-person", "online", "hybrid")
    pub interview_format: Option<String>,
    /// When applicants will be notified of outcomes
    pub outcomes_released_at: Option<DateTime<Utc>>,
    /// Additional application requirements (e.g., "Resume required", "No economics background needed")
    pub application_requirements: Option<String>,
}

/// Response structure for campaign banner updates.
/// 
/// Contains the URL where the new banner image can be uploaded.
#[derive(Serialize)]
pub struct CampaignBannerUpdate {
    /// URL where the new banner image can be uploaded
    pub upload_url: String,
}

/// Represents a campaign attachment (role document).
/// 
/// A campaign attachment is a file associated with a campaign, typically
/// used to store role documents or other campaign-related files.
#[derive(Deserialize, Serialize, Clone, FromRow, Debug)]
pub struct CampaignAttachment {
    /// Unique identifier for the attachment
    #[serde(serialize_with = "crate::models::serde_string::serialize")]
    pub id: i64,
    /// ID of the campaign this attachment belongs to
    #[serde(serialize_with = "crate::models::serde_string::serialize")]
    pub campaign_id: i64,
    /// Original filename of the uploaded file
    pub file_name: String,
    /// Size of the file in bytes
    pub file_size: i64,
}

/// Response structure for role document retrieval.
/// 
/// Contains the attachment metadata and a pre-signed URL for downloading the file.
#[derive(Serialize)]
pub struct AttachmentResponse {
    /// Unique identifier for the attachment
    #[serde(serialize_with = "crate::models::serde_string::serialize")]
    pub id: i64,
    /// ID of the campaign this attachment belongs to
    #[serde(serialize_with = "crate::models::serde_string::serialize")]
    pub campaign_id: i64,
    /// Original filename of the uploaded file
    pub file_name: String,
    /// Size of the file in bytes
    pub file_size: i64,
    /// Pre-signed URL for downloading the file (valid for 1 hour)
    pub download_url: String,
}

/// Request structure for uploading a role document.
/// 
/// Contains the file metadata needed to create a new attachment.
#[derive(Deserialize)]
pub struct NewAttachment {
    /// Original filename of the file
    pub file_name: String,
    /// Size of the file in bytes
    pub file_size: i64,
}

/// Response structure for role document upload.
/// 
/// Contains the pre-signed URL where the file can be uploaded.
#[derive(Serialize)]
pub struct AttachmentUpload {
    /// ID of the created attachment record
    #[serde(serialize_with = "crate::models::serde_string::serialize")]
    pub attachment_id: i64,
    /// Pre-signed URL for uploading the file
    pub upload_url: String,
}

impl Campaign {
    /// Retrieves all campaigns in the system.
    /// 
    /// # Arguments
    /// 
    /// * `transaction` - Database transaction to use
    /// 
    /// # Returns
    /// 
    /// * `Result<Vec<Campaign>, ChaosError>` - List of campaigns or error
    pub async fn get_all(
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<Vec<Campaign>, ChaosError> {
        let campaigns = sqlx::query_as!(
            Campaign,
            "
                SELECT c.*, o.name as organisation_name, o.slug as organisation_slug
                FROM campaigns c
                JOIN organisations o on c.organisation_id = o.id
            "
        )
        .fetch_all(transaction.deref_mut())
        .await?;

        Ok(campaigns)
    }

    /// Retrieves a campaign by its ID.
    /// 
    /// # Arguments
    /// 
    /// * `id` - ID of the campaign to retrieve
    /// * `transaction` - Database transaction to use
    /// 
    /// # Returns
    /// 
    /// * `Result<CampaignDetails, ChaosError>` - Campaign details or error
    pub async fn get(
        id: i64,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<CampaignDetails, ChaosError> {
        let campaign = sqlx::query_as!(
            CampaignDetails,
            "
                SELECT c.id, c.slug AS campaign_slug, c.name, c.organisation_id,
                o.slug AS organisation_slug, o.name as organisation_name, 
                o.contact_email, o.website_url, c.cover_image,
                c.description, c.starts_at, c.ends_at, c.published, c.interview_period_starts_at, 
                c.interview_period_ends_at, c.interview_format, c.outcomes_released_at, c.max_roles_per_application,
                c.application_requirements
                FROM campaigns c
                JOIN organisations o on c.organisation_id = o.id
                WHERE c.id = $1
            ",
            id
        )
        .fetch_one(transaction.deref_mut())
        .await?;

        Ok(campaign)
    }

    /// Checks if a slug is available for a new campaign.
    /// 
    /// # Arguments
    /// 
    /// * `organisation_id` - ID of the organization creating the campaign
    /// * `slug` - Slug to check
    /// * `pool` - Database connection pool
    /// 
    /// # Returns
    /// 
    /// * `Result<(), ChaosError>` - Success if slug is available, error if not
    pub async fn check_slug_availability(
        organisation_id: i64,
        mut slug: String,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<(), ChaosError> {
        if !slug.is_ascii() {
            return Err(ChaosError::BadRequest);
        }

        slug = create_proper_slug(&slug);

        let exists = sqlx::query!(
            "
                SELECT EXISTS(SELECT 1 FROM campaigns WHERE organisation_id = $1 AND slug = $2)
            ",
            organisation_id,
            slug
        )
        .fetch_one(transaction.deref_mut())
        .await?
        .exists
        .expect("`exists` should always exist in this query result");

        if exists {
            return Err(ChaosError::BadRequest);
        }

        Ok(())
    }

    /// Retrieves a campaign by its organization and campaign slugs.
    /// 
    /// # Arguments
    /// 
    /// * `organisation_slug` - Slug of the organization
    /// * `campaign_slug` - Slug of the campaign
    /// * `transaction` - Database transaction to use
    /// 
    /// # Returns
    /// 
    /// * `Result<CampaignDetails, ChaosError>` - Campaign details or error
    pub async fn get_by_slugs(
        organisation_slug: String,
        campaign_slug: String,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<CampaignDetails, ChaosError> {
        let campaign = sqlx::query_as!(
            CampaignDetails,
            "
                SELECT c.id, c.slug AS campaign_slug, c.name, c.organisation_id,
                o.slug AS organisation_slug, o.name as organisation_name, 
                o.contact_email, o.website_url, c.cover_image, 
                c.description, c.starts_at, c.ends_at, c.published, c.max_roles_per_application,
                c.interview_period_starts_at, c.interview_period_ends_at, c.interview_format, 
                c.outcomes_released_at, c.application_requirements
                FROM campaigns c
                JOIN organisations o on c.organisation_id = o.id
                WHERE c.slug = $1 AND o.slug = $2
            ",
            campaign_slug,
            organisation_slug
        )
        .fetch_one(transaction.deref_mut())
        .await?;

        Ok(campaign)
    }

    /// Updates an existing campaign.
    /// 
    /// # Arguments
    /// 
    /// * `id` - ID of the campaign to update
    /// * `update` - New campaign data
    /// * `transaction` - Database transaction to use
    /// 
    /// # Returns
    /// 
    /// * `Result<(), ChaosError>` - Success or error
    pub async fn update(
        id: i64,
        update: CampaignUpdate,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<(), ChaosError> {
        update.validate()?;

        _ = sqlx::query!(
            "
                UPDATE campaigns
                SET slug = $1, name = $2, description = $3, starts_at = $4, ends_at = $5,
                interview_period_starts_at = $6, interview_period_ends_at = $7,
                interview_format = $8, outcomes_released_at = $9, application_requirements = $10
                WHERE id = $11 RETURNING id
            ",
            update.slug,
            update.name,
            update.description,
            update.starts_at,
            update.ends_at,
            update.interview_period_starts_at,
            update.interview_period_ends_at,
            update.interview_format,
            update.outcomes_released_at,
            update.application_requirements,
            id
        )
        .fetch_one(transaction.deref_mut())
        .await?;

        Ok(())
    }

    /// Publishes a campaign by setting its published field to true.
    /// 
    /// # Arguments
    /// 
    /// * `id` - ID of the campaign to publish
    /// * `transaction` - Database transaction to use
    /// 
    /// # Returns
    /// 
    /// * `Result<(), ChaosError>` - Success or error
    pub async fn publish(
        id: i64,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<(), ChaosError> {
        _ = sqlx::query!(
            "
                UPDATE campaigns
                SET published = true
                WHERE id = $1 RETURNING id
            ",
            id
        )
        .fetch_one(transaction.deref_mut())
        .await?;

        Ok(())
    }

    /// Publishes a campaign by setting its published field to true.
    /// 
    /// # Arguments
    /// 
    /// * `id` - ID of the campaign to publish
    /// * `transaction` - Database transaction to use
    /// 
    /// # Returns
    /// 
    /// * `Result<(), ChaosError>` - Success or error
    pub async fn publish(
        id: i64,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<(), ChaosError> {
        _ = sqlx::query!(
            "
                UPDATE campaigns
                SET published = true
                WHERE id = $1 RETURNING id
            ",
            id
        )
        .fetch_one(transaction.deref_mut())
        .await?;

        Ok(())
    }

    /// Updates a campaign's banner image.
    /// 
    /// # Arguments
    /// 
    /// * `id` - ID of the campaign to update
    /// * `transaction` - Database transaction to use
    /// * `storage_bucket` - S3 bucket for storing the image
    /// 
    /// # Returns
    /// 
    /// * `Result<CampaignBannerUpdate, ChaosError>` - Upload URL or error
    pub async fn update_banner(
        id: i64,
        transaction: &mut Transaction<'_, Postgres>,
        storage_bucket: &Bucket,
    ) -> Result<CampaignBannerUpdate, ChaosError> {
        let dt = Utc::now();
        let image_id = Uuid::new_v4();
        let current_time = dt;

        _ = sqlx::query!(
            "
                UPDATE campaigns
                SET cover_image = $1, updated_at = $2
                WHERE id = $3 RETURNING id
            ",
            image_id,
            current_time,
            id
        )
        .fetch_one(transaction.deref_mut())
        .await?;

        let upload_url =
            Storage::generate_put_url(format!("/banner/{id}/{image_id}"), storage_bucket).await?;

        Ok(CampaignBannerUpdate { upload_url })
    }

    /// Deletes a campaign.
    /// 
    /// # Arguments
    /// 
    /// * `id` - ID of the campaign to delete
    /// * `transaction` - Database transaction to use
    /// 
    /// # Returns
    /// 
    /// * `Result<(), ChaosError>` - Success or error
    pub async fn delete(
        id: i64,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<(), ChaosError> {
        _ = sqlx::query!(
            "
                DELETE FROM campaigns WHERE id = $1 RETURNING id
            ",
            id
        )
        .fetch_one(transaction.deref_mut())
        .await?;

        Ok(())
    }
}

impl CampaignAttachment {
    /// Retrieves the attachments for a campaign.
    /// 
    /// # Arguments
    /// 
    /// * `campaign_id` - ID of the campaign
    /// * `transaction` - Database transaction to use
    /// 
    /// # Returns
    /// 
    /// * `Result<Vec<CampaignAttachment>, ChaosError>` - The attachments or None if not found
    pub async fn get_by_campaign(
        campaign_id: i64,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<Vec<CampaignAttachment>, ChaosError> {
        let attachments = sqlx::query_as!(
            CampaignAttachment,
            "
                SELECT id, campaign_id, file_name, file_size
                FROM campaign_attachments
                WHERE campaign_id = $1
            ",
            campaign_id
        )
        .fetch_all(transaction.deref_mut())
        .await?;

        Ok(attachments)
    }

    /// Retrieves an attachment by its ID.
    /// 
    /// # Arguments
    /// 
    /// * `attachment_id` - ID of the attachment
    /// * `transaction` - Database transaction to use
    /// 
    /// # Returns
    /// 
    /// * `Result<CampaignAttachment, ChaosError>` - The attachment or error if not found
    pub async fn get_by_id(
        attachment_id: i64,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<CampaignAttachment, ChaosError> {
        let attachment = sqlx::query_as!(
            CampaignAttachment,
            "
                SELECT id, campaign_id, file_name, file_size
                FROM campaign_attachments
                WHERE id = $1
            ",
            attachment_id
        )
        .fetch_one(transaction.deref_mut())
        .await?;

        Ok(attachment)
    }

    /// Creates or updates multiple attachments for a campaign.
    /// 
    /// If an attachment already exists for the campaign, it will be updated.
    /// Otherwise, a new attachment will be created for each file.
    /// 
    /// # Arguments
    /// 
    /// * `campaign_id` - ID of the campaign
    /// * `files` - List of files to upload
    /// * `transaction` - Database transaction to use
    /// * `snowflake_generator` - Generator for creating unique IDs
    /// * `storage_bucket` - S3 bucket for storing the file
    /// 
    /// # Returns
    /// 
    /// * `Result<AttachmentUpload, ChaosError>` - Upload URL and attachment ID
    pub async fn create_or_update_multiple(
        campaign_id: i64,
        files: Vec<NewAttachment>,
        transaction: &mut Transaction<'_, Postgres>,
        snowflake_generator: &mut SnowflakeIdGenerator,
        storage_bucket: &Bucket,
    ) -> Result<Vec<AttachmentUpload>, ChaosError> {
        // Check if attachment already exists
        let existing = Self::get_by_campaign(campaign_id, transaction).await?;
        let campaign = Campaign::get(campaign_id, transaction).await?;

        let mut attachment_ids = Vec::new();
        for file in files {
            let mut attachment_id = None;
            for existing_attachment in &existing {
                if existing_attachment.file_name == file.file_name {
                    attachment_id = Some(existing_attachment.id);
                    break;
                }
            }

            let attachment_id = if let Some(id) = attachment_id {
                id
            } else {
                // Create new attachment
                let new_id = snowflake_generator.real_time_generate();
                sqlx::query!(
                    "
                        INSERT INTO campaign_attachments (id, campaign_id, file_name, file_size)
                        VALUES ($1, $2, $3, $4)
                        RETURNING id
                    ",
                    new_id,
                    campaign_id,
                    file.file_name,
                    file.file_size
                )
                .fetch_one(transaction.deref_mut())
                .await?.id
            };
            attachment_ids.push(attachment_id);
        }

        let mut results = Vec::new();
        for id in attachment_ids {
            let upload_url = Storage::generate_put_url(
                format!("/organisation/{}/campaign/{}/attachment/{}", campaign.organisation_id, campaign.id, id),
                storage_bucket,
            )
            .await?;

            results.push(AttachmentUpload {
                upload_url,
                attachment_id: id,
            });
        }
        
        Ok(results)
    }

    /// Deletes an attachment.
    /// 
    /// # Arguments
    /// 
    /// * `attachment_id` - ID of the attachment to delete
    /// * `transaction` - Database transaction to use
    /// 
    /// # Returns
    /// 
    /// * `Result<i64, ChaosError>` - The ID of the deleted attachment or error if not found
    pub async fn delete(
        attachment_id: i64,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<(), ChaosError> {
        let id = sqlx::query!(
            "
                DELETE FROM campaign_attachments WHERE id = $1 RETURNING id
            ",
            attachment_id
        )
        .fetch_one(transaction.deref_mut())
        .await?;

        Ok(())
    }
}
/// Extractor for ensuring a campaign is open.
/// 
/// This extractor is used in route handlers to ensure that the campaign
/// being accessed is currently accepting applications.
pub struct OpenCampaign;

#[async_trait]
impl<S> FromRequestParts<S> for OpenCampaign
where
    AppState: FromRef<S>,
    S: Send + Sync,
{
    type Rejection = ChaosError;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let app_state = AppState::from_ref(state);
        let Path(campaign_id) = parts
            .extract::<Path<i64>>()
            .await
            .map_err(|_| ChaosError::BadRequest)?;

        let mut tx = app_state.db.begin().await?;
        assert_campaign_is_open(campaign_id, &mut tx).await?;
        tx.commit().await?;

        Ok(OpenCampaign)
    }
}


impl CampaignUpdate {
    pub fn validate(&self) -> Result<(), ChaosError> {
        let campaign_name_max_chars = env::var("CAMPAIGN_NAME_MAX_CHARS")
            .expect("Error getting CAMPAIGN_NAME_MAX_CHARS")
            .to_string().parse::<usize>().map_err(|_| ChaosError::InternalServerError)?;
        let campaign_description_max_chars = env::var("CAMPAIGN_DESCRIPTION_MAX_CHARS")
            .expect("Error getting CAMPAIGN_DESCRIPTION_MAX_CHARS")
            .to_string().parse::<usize>().map_err(|_| ChaosError::InternalServerError)?;
        
        if self.name.len() > campaign_name_max_chars || 
              self.description.len() > campaign_description_max_chars ||
              self.name.is_empty() || 
              self.slug.is_empty() ||
              self.starts_at >= self.ends_at {
            return Err(ChaosError::BadRequest);
        }

        // TODO: update to ensure one day apart min to match frontend
        Ok(())
    }
}