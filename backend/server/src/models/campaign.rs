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

#[derive(Deserialize, Serialize, Clone, FromRow, Debug)]
pub struct Campaign {
    pub id: i64,
    pub slug: String,
    pub name: String,
    pub organisation_id: i64,
    pub organisation_name: String,
    pub cover_image: Option<Uuid>,
    pub description: Option<String>,
    pub starts_at: DateTime<Utc>,
    pub ends_at: DateTime<Utc>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Deserialize, Serialize, Clone, FromRow, Debug)]
pub struct CampaignDetails {
    pub id: i64,
    pub campaign_slug: String,
    pub name: String,
    pub organisation_id: i64,
    pub organisation_slug: String,
    pub organisation_name: String,
    pub cover_image: Option<Uuid>,
    pub description: Option<String>,
    pub starts_at: DateTime<Utc>,
    pub ends_at: DateTime<Utc>,
}

#[derive(Deserialize, Serialize, Clone, FromRow, Debug)]
pub struct OrganisationCampaign {
    pub id: i64,
    pub slug: String,
    pub name: String,
    pub cover_image: Option<Uuid>,
    pub description: Option<String>,
    pub starts_at: DateTime<Utc>,
    pub ends_at: DateTime<Utc>,
}

#[derive(Deserialize)]
pub struct NewCampaign {
    pub slug: String,
    pub name: String,
    pub description: Option<String>,
    pub starts_at: DateTime<Utc>,
    pub ends_at: DateTime<Utc>
}

#[derive(Deserialize, Serialize, Clone, FromRow, Debug)]
pub struct CampaignUpdate {
    pub slug: String,
    pub name: String,
    pub description: String,
    pub starts_at: DateTime<Utc>,
    pub ends_at: DateTime<Utc>,
}

#[derive(Serialize)]
pub struct CampaignBannerUpdate {
    pub upload_url: String,
}

impl Campaign {
    /// Get a list of all campaigns, both published and unpublished
    pub async fn get_all(
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<Vec<Campaign>, ChaosError> {
        let campaigns = sqlx::query_as!(
            Campaign,
            "
                SELECT c.*, o.name as organisation_name FROM campaigns c
                JOIN organisations o on c.organisation_id = o.id
            "
        )
        .fetch_all(transaction.deref_mut())
        .await?;

        Ok(campaigns)
    }

    /// Get a campaign based on it's id
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

    pub async fn check_slug_availability(
        organisation_id: i64,
        slug: String,
        pool: &Pool<Postgres>,
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
        .fetch_one(pool)
        .await?
        .exists
        .expect("`exists` should always exist in this query result");

        if exists {
            return Err(ChaosError::BadRequest);
        }

        Ok(())
    }

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

    /// Update a campaign for all fields that are not None
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

    /// Update a campaign banner
    /// Returns the updated campaign
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

    /// Delete a campaign from the database
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

        let campaign_id = *parts
            .extract::<Path<HashMap<String, i64>>>()
            .await
            .map_err(|_| ChaosError::BadRequest)?
            .get("application_id")
            .ok_or(ChaosError::BadRequest)?;

        assert_campaign_is_open(campaign_id, &app_state.db).await?;

        Ok(OpenCampaign)
    }
}
