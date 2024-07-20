use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use s3::Bucket;
use sqlx::{Pool, Postgres};
use uuid::Uuid;


use super::{error::ChaosError, storage::Storage};


#[derive(Deserialize, Serialize, Clone, FromRow, Debug)]
pub struct Campaign {
    pub id: i64,
    pub name: String,
    pub organisation_id: i64,
    pub organisation_name: String,
    pub cover_image: Option<Uuid>,
    pub description: Option<String>,
    pub starts_at: DateTime<Utc>,
    pub ends_at: DateTime<Utc>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>
}

#[derive(Deserialize, Serialize, Clone, FromRow, Debug)]
pub struct CampaignDetails {
    pub id: i64,
    pub name: String,
    pub organisation_id: i64,
    pub organisation_name: String,
    pub cover_image: Option<Uuid>,
    pub description: Option<String>,
    pub starts_at: DateTime<Utc>,
    pub ends_at: DateTime<Utc>,
}
#[derive(Deserialize, Serialize, Clone, FromRow, Debug)]
pub struct OrganisationCampaign {
    pub id: i64,
    pub name: String,
    pub cover_image: Option<Uuid>,
    pub description: Option<String>,
    pub starts_at: DateTime<Utc>,
    pub ends_at: DateTime<Utc>,
}



#[derive(Deserialize, Serialize, Clone, FromRow, Debug)]
pub struct CampaignUpdate {
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
pub async fn get_all(pool: &Pool<Postgres>) -> Result<Vec<Campaign>, ChaosError> {
        let campaigns = sqlx::query_as!(
            Campaign,
            "
                SELECT c.*, o.name as organisation_name FROM campaigns c
                JOIN organisations o on c.organisation_id = o.id
            "
        )
        .fetch_all(pool)
        .await?;
          
        Ok(campaigns)
    }


    /// Get a campaign based on it's id
    pub async fn get(id: i64, pool: &Pool<Postgres>) -> Result<CampaignDetails, ChaosError> {
        let campaign = sqlx::query_as!(
            CampaignDetails,
        "
            SELECT c.id, c.name, c.organisation_id, o.name as organisation_name,
            c.cover_image, c.description, c.starts_at, c.ends_at
            FROM campaigns c
            JOIN organisations o on c.organisation_id = o.id
            WHERE c.id = $1
        ",
            id
        )
        .fetch_one(pool)
        .await?;

        Ok(campaign)
    }

    /// Update a campaign for all fields that are not None
    pub async fn update(
        id: i64,
        update: CampaignUpdate,
        pool: &Pool<Postgres>,
    ) -> Result<(), ChaosError> {
        sqlx::query!(
        "
            UPDATE campaigns
            SET name = $1, description = $2, starts_at = $3, ends_at = $4
            WHERE id = $5
        ",
            update.name,
            update.description,
            update.starts_at,
            update.ends_at,
            id
        )
        .execute(pool)
        .await?;

       Ok(())
    }

    /// Update a campaign banner
    /// Returns the updated campaign
    pub async fn update_banner(
        id: i64,
        pool: &Pool<Postgres>,
        storage_bucket: &Bucket,
    ) -> Result<CampaignBannerUpdate, ChaosError> {
        let dt = Utc::now();
        let image_id = Uuid::new_v4();
        let current_time = dt;

        sqlx::query!(
        "
            UPDATE campaigns
            SET cover_image = $1, updated_at = $2
            WHERE id = $3
        ",
            image_id,
            current_time,
            id
        )
        .execute(pool)
        .await?;

        let upload_url = Storage::generate_put_url(format!("/banner/{id}/{image_id}"), storage_bucket).await?;
        
        Ok(
            CampaignBannerUpdate {
                upload_url
            }
        )
    }

    /// Delete a campaign from the database
    pub async fn delete(id: i64, pool: &Pool<Postgres>) -> Result<(), ChaosError> {
        sqlx::query!(
            "
                DELETE FROM campaigns WHERE id = $1
            ",
            id
        )
        .execute(pool)
        .await?;

        Ok(())
    }

}