use anyhow::Result;
use sqlx::{Pool, Postgres};
use crate::models::campaign::{self, Campaign, CampaignRole, CampaignRoleUpdate, CampaignUpdate};

/// Get a list of all campaigns, both published and unpublished
pub async fn get_campaigns(pool: Pool<Postgres>) -> Result<Vec<Campaign>>{
    todo!();
}

/// Get a list of all published (public) campaigns
pub async fn get_public_campaigns(pool: Pool<Postgres>) -> Result<Vec<Campaign>> {
    todo!();
}

/// Get a list of all unpublished (private) campaigns
pub async fn get_private_campaigns(pool: Pool<Postgres>) -> Result<Vec<Campaign>> {
    todo!();
}


/// Get a campaign based on it's id
pub async fn get_campaign(campaign_id: i64, pool: Pool<Postgres>) -> Result<Campaign> {
    todo!();
}

// OPTIONAL(?)
pub async fn get_campaign_by_name(campaign_name: String, pool: Pool<Postgres>) -> Result<Campaign> {
    todo!()
}

/// Creates a new campaign if there isn't already a campaign with the same name
/// Returns the newly created campaign's id
pub async fn new_campaign(campaign: Campaign, pool: Pool<Postgres>) -> Result<i64> {
    // Check if campaign name is in use
    
    // Generate id

    // Insert into db
    todo!();
}

/// Update a campaign for all fields that are not None
/// Returns the updated campaign
pub async fn update_campaign(campaign_id: i64, campaign: CampaignUpdate,  pool: Pool<Postgres>) -> Result<Campaign> {
    todo!();
}

/// Delete a campaign from the database
pub async fn delete_campaign(campaign_id: i64, pool: Pool<Postgres>) -> Result<()> {
    todo!();
}

/// Get a list of all roles for a campaign 
pub async fn get_campaign_roles(campaign_id: i64, pool: Pool<Postgres>) -> Result<Vec<CampaignRole>> {
    todo!();
}

/// Get a particular role for a campaign (?)
pub async fn get_campaign_role(role_id: i64, pool: Pool<Postgres>) -> Result<CampaignRole> {
    todo!();
}

/// Update a role for the campaign
/// Returns the updated role
pub async fn update_campaign_role(role_id: i64, role: CampaignRoleUpdate, pool: Pool<Postgres>) -> Result<Campaign> {
    todo!();
}

/// Add a role to the campaign
/// Returns the new role's id
pub async fn add_role_to_campaign(campaign_id: i64, role: CampaignRole, pool: Pool<Postgres>) ->Result<i64> {
    todo!();
} 

/// Remove a role from the campaign (and delete it? no hanging roles, right...?)
pub async fn delete_role_from_campaign(campaign_id: i64, role_id: i64, pool: Pool<Postgres>) -> Result<()> {
    todo!();
}