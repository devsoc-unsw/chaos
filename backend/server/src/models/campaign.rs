//! Campaign management module for the Chaos application.
//! 
//! This module provides functionality for managing recruitment campaigns,
//! including creation, updates, and retrieval of campaign information.
//! It also handles campaign banner management and campaign status tracking.

use std::collections::HashMap;
use chrono::{DateTime, Utc};
use s3::Bucket;
use serde::{Deserialize, Serialize};
use sqlx::{FromRow, Transaction};
use sqlx::{Pool, Postgres};
use std::ops::DerefMut;
use axum::{async_trait, RequestPartsExt};
use axum::extract::{FromRef, FromRequestParts, Path};
use axum::http::request::Parts;
use uuid::Uuid;
use crate::models::app::AppState;
use crate::service::campaign::assert_campaign_is_open;
use super::{error::ChaosError, storage::Storage};

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
    /// Optional UUID of the campaign's cover image
    pub cover_image: Option<Uuid>,
    /// Optional description of the campaign
    pub description: Option<String>,
    /// When the campaign starts accepting applications
    pub starts_at: DateTime<Utc>,
    /// When the campaign stops accepting applications
    pub ends_at: DateTime<Utc>,
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
    /// URL-friendly identifier for the campaign
    pub slug: String,
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
    pub ends_at: DateTime<Utc>
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
}

/// Response structure for campaign banner updates.
/// 
/// Contains the URL where the new banner image can be uploaded.
#[derive(Serialize)]
pub struct CampaignBannerUpdate {
    /// URL where the new banner image can be uploaded
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
                o.slug AS organisation_slug, o.name as organisation_name, c.cover_image,
                c.description, c.starts_at, c.ends_at
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
        slug: String,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<(), ChaosError> {
        if !slug.is_ascii() {
            return Err(ChaosError::BadRequest);
        }

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
                o.slug AS organisation_slug, o.name as organisation_name, c.cover_image,
                c.description, c.starts_at, c.ends_at
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
        _ = sqlx::query!(
            "
                UPDATE campaigns
                SET slug = $1, name = $2, description = $3, starts_at = $4, ends_at = $5
                WHERE id = $6 RETURNING id
            ",
            update.slug,
            update.name,
            update.description,
            update.starts_at,
            update.ends_at,
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
