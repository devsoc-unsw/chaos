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

// TODO UPDATE
pub struct CampaignRole {
    pub id: i64,
    pub campaign: Campaign,
    pub campaign_id: i64,
    pub name: String,
    pub description: Option<String>,
    pub min_available: i32,
    pub max_available: i32,
    pub finalised: bool,
    pub created_at: DateTime<Utc>, 
    pub updated_at: DateTime<Utc>,    
    // pub application: Vec<Application>,
}
// TODO UPDATE
pub struct CampaignRoleUpdate {
    pub id: i64,
    pub name: Option<String>,
    pub description: Option<String>,
    pub min_available: Option<i32>,
    pub max_available: Option<i32>,
    pub finalised: Option<bool>,
    pub updated_at: DateTime<Utc>,    
    // pub application: Option<Vec<Application>>,
}

// pub struct CampaignList {
//     pub published_campaigns: Vec<Campaign>,
//     pub unpublished_campaigns: Vec<Campaign>,
// }