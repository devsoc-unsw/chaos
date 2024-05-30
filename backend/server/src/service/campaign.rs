use crate::models::campaign::{self, Campaign, CampaignRole, CampaignRoleUpdate, CampaignUpdate};
use anyhow::{bail, Result};
use chrono::Local;
use sqlx::{Pool, Postgres};

/// Get a list of all campaigns, both published and unpublished
pub async fn get_campaigns(pool: Pool<Postgres>) -> Result<Vec<Campaign>> {
    // TODO check meaning of 'active' campaign
    let campaigns = sqlx::query!("SELECT * FROM CAMPAIGNS")
        .fetch_all(&pool)
        .await?
        .into_iter()
        .map(|campaign_row| Campaign {
            id: campaign_row.id,
            organisation_id: campaign_row.organisation_id,
            name: campaign_row.name,
            cover_image: campaign_row.cover_image,
            description: campaign_row.description,
            starts_at: campaign_row.starts_at,
            ends_at: campaign_row.ends_at,
        })
        .collect();
    Ok(campaigns)
}

/// Get a campaign based on it's id
pub async fn get_campaign(campaign_id: i64, pool: Pool<Postgres>) -> Result<Campaign> {
    let res = sqlx::query!(
        "SELECT * FROM CAMPAIGNS
         WHERE id = $1",
        campaign_id
    )
    .fetch_optional(&pool)
    .await?
    .map(|campaign_row| Campaign {
        id: campaign_row.id,
        organisation_id: campaign_row.organisation_id,
        name: campaign_row.name,
        cover_image: campaign_row.cover_image,
        description: campaign_row.description,
        starts_at: campaign_row.starts_at,
        ends_at: campaign_row.ends_at,
    });

    match res {
        Some(campaign) => Ok(campaign),
        None => bail!("Campaign with id {:?} doesn't exist", campaign_id),
    }
}

/// Update a campaign for all fields that are not None
/// Returns the updated campaign
pub async fn update_campaign(
    campaign_id: i64,
    update: CampaignUpdate,
    pool: Pool<Postgres>,
) -> Result<String> {
    let res = sqlx::query!(
        "UPDATE campaigns
        SET name = $1, description = $2, starts_at = $3, ends_at = $4
        WHERE id = $5
        RETURNING *",
        update.name,
        update.description,
        update.starts_at,
        update.ends_at,
        campaign_id
    )
    .fetch_one(&pool)
    .await;

    match res {
        Ok(_) => Ok("Successfully updated campaign".to_string()),
        Err(_) => bail!("Campaign with id {campaign_id:?} does not exist"),
    }
}

/// Update a campaign banner
/// Returns the updated campaign
pub async fn update_campaign_banner(
    campaign_id: i64,
    banner: String,
    pool: Pool<Postgres>,
) -> Result<String> {
    let res = sqlx::query!(
        "UPDATE campaigns
        SET cover_image = $1
        WHERE id = $2
        RETURNING *",
        banner,
        campaign_id
    )
    .fetch_one(&pool)
    .await;

    match res {
        Ok(_) => Ok(banner),
        Err(_) => bail!("Campaign with id {campaign_id:?} does not exist"),
    }
}

/// Delete a campaign from the database
pub async fn delete_campaign(campaign_id: i64, pool: Pool<Postgres>) -> Result<String> {
    let res = sqlx::query!(
        "DELETE FROM campaigns
        WHERE id = $1",
        campaign_id
    )
    .execute(&pool)
    .await?;

    match res.rows_affected() {
        0 => bail!("Campaign not found"),
        _ => Ok("Successfully deleted campaign".to_string()),
    }
}
