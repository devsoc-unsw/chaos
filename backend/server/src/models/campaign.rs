use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Deserialize, Serialize, Clone, FromRow, Debug)]
pub struct Campaign {
    pub id: i64,
    pub organisation_id: i64,
    pub name: String,
    pub cover_image: Option<String>,
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

pub struct CampaignBannerUpdate {
    pub upload_url: String,
}

