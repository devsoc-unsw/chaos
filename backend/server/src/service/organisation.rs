use anyhow::{bail, Result};
use sqlx::{Pool, Postgres};
use chrono::{DateTime, Local, NaiveDateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize)]
pub struct OrganisationDetails {
    pub id: i64,
    pub name: String,
    pub logo: Option<String>,
    pub created_at: DateTime<Utc>
}

pub async fn get_organisation(id: i64, pool: Pool<Postgres>) -> Result<OrganisationDetails> {
    let organisation_details = sqlx::query!
    (
        "
            SELECT *
                FROM organisations
                WHERE id = $1
        ",
        id).fetch_optional(&pool)
        .await?;

    if let Some(result) = organisation_details {
        let details = OrganisationDetails {
            id: result.id,
            name: result.name,
            logo: result.logo,
            created_at: result.created_at.and_utc()
        };
        return Ok(details);
    }

    bail!("error: failed to get organisation");
}


pub async fn update_organisation_logo(id: i64, logo: String, pool: Pool<Postgres>) -> Result<String> {
    let dt = Local::now();
    let current_time = dt.naive_utc();
    let updated_organisation = sqlx::query!
    (
        "
            UPDATE organisations
                SET logo = $2, updated_at = $3
                WHERE id = $1
                RETURNING *
        ",
        id,
        logo,
        current_time
    ).fetch_one(&pool)
    .await;

    match updated_organisation {
        Ok(_) => Ok(logo),
        Err(_) => bail!("error: Failed to update organisation logo")
    }
}

pub async fn delete_organisation(organisation_id: i64, admin_id: i64, pool: Pool<Postgres>) -> Result<String, String> {
   // Delete all organisation_admins with the corresponding organisation_id
   let deleted_users = sqlx::query!
    (
        "
            WITH user_exists AS (
                SELECT 1 AS exists_flag
                FROM organisation_admins
                WHERE organisation_id = $1
                AND user_id = $2
                LIMIT 1
            )
            DELETE FROM organisation_admins
                WHERE organisation_id = $1
                AND EXISTS (
                    SELECT 1
                    FROM user_exists
                )
                RETURNING *
        ",
        organisation_id,
        admin_id
   ).fetch_one(&pool)
   .await;

   match deleted_users {
        Ok(_) => {},
        Err(_) => return Err("Unauthorized".to_string())
   }

   
   // Delete organisation
   let deleted_organisation = sqlx::query!
   (
        "
            DELETE FROM organisations WHERE id = $1
                RETURNING *
        ",
        organisation_id
    ).fetch_one(&pool)
    .await;

  match deleted_organisation {
    Ok(_) => {
        Ok("Successfully deleted organisation.".to_string())
    },
    Err(_) => Err("Unauthorized".to_string())
}

}

pub async fn create_organisation(id: i64, name: String, pool: Pool<Postgres>) -> Result<String> {
    let new_organisation = sqlx::query!
    (
        "
            INSERT INTO organisations (id, name)
                VALUES ($1, $2)
                RETURNING *
        ",
        id,
        name
    ).fetch_one(&pool).await;

    match new_organisation {
        Ok(_) => {
            Ok("Successfully created organisation.".to_string())
        },
        Err(_) => bail!("error: failed to create organisation")
    }
}

#[derive(Deserialize, Serialize)]
pub struct Member {
    pub id: i64,
    pub name: String
}
pub async fn get_organisation_admins(organisation_id: i64, pool: Pool<Postgres>) -> Result<Vec<Member>> {
    let admin_list = sqlx::query!
    (
        "
            SELECT user_id
                FROM organisation_admins
                WHERE organisation_id = $1
        "
        , organisation_id
    ).fetch_all(&pool).await?;

    let admin_id_list: Vec<i64> = admin_list.into_iter().map(|row| row.user_id).collect();

    if admin_id_list.is_empty() {
        return Ok(Vec::new());
    }

    let mut users = Vec::new();

    for id in admin_id_list {
        let user_object = sqlx::query!(
            "
                SELECT id, name
                FROM users
                WHERE id = $1
            "
            , id
            
        )
        .fetch_one(&pool)
        .await?;
        users.push(
            Member {
                id: user_object.id,
                name: user_object.name
            }
        )
    }

    Ok(users)
}

pub async fn update_organisation_admins(organisation_id: i64, admin_id_list: Vec<i64>, pool: Pool<Postgres>) -> Result<String> {
    sqlx::query!(
        "DELETE FROM organisation_admins WHERE organisation_id = $1",
        organisation_id
    )
    .execute(&pool)
    .await?;

    for admin_id in admin_id_list {
        sqlx::query!(
            "
            INSERT INTO organisation_admins (organisation_id, user_id)
            VALUES ($1, $2)
            ",
            organisation_id,
            admin_id
        )
        .execute(&pool)
        .await?;
    }

    Ok("Successfully updated members.".to_string())
}

pub async fn remove_admin_from_organisation(organisation_id: i64, admin_id: i64, pool: Pool<Postgres>) -> Result<String> {
    let new_organisation_admin = sqlx::query!
    (
        "
            DELETE FROM organisation_admins
                WHERE organisation_id = $1
                AND user_id = $2
                RETURNING *
        ",
        organisation_id,
        admin_id
    ).fetch_one(&pool).await;

    match new_organisation_admin {
        Ok(_) => {
            println!("{:?}", new_organisation_admin);
            Ok("Deleted organisation admin in database".to_string())
        },
        Err(_) => bail!("error: failed to remove admin from organisation")
    }
}


#[derive(Deserialize, Serialize)]
pub struct Campaign {
    // Define your struct fields based on the Campaign model
    // For example:
    pub id: i64,
    pub name: String,
    pub cover_image: Option<String>,
    pub description: String,
    pub starts_at: DateTime<Utc>,
    pub ends_at: DateTime<Utc>,
}
pub async fn get_organisation_campaigns(id: i64, pool: Pool<Postgres>) -> Result<Vec<Campaign>> {
    let campaigns = sqlx::query!
    (
        "
            SELECT *
                FROM campaigns
                WHERE organisation_id = $1
        ",
        id
    ).fetch_all(&pool).await;

    let mut result: Vec<Campaign> = Vec::new();
    match campaigns {
        Ok(campaign_list) => {
            for campaign in campaign_list {
                let details = Campaign {
                    id: campaign.id,
                    name: campaign.name,
                    cover_image: campaign.cover_image,
                    description: campaign.description,
                    starts_at: campaign.starts_at.and_utc(),
                    ends_at: campaign.ends_at.and_utc()
                };
                result.push(details);
            }
        },
        Err(_) => bail!("Error getting organisation campaign")
    }
    Ok(result)
}

pub async fn create_campaign_for_organisation(id: i64, name: String, description: String, starts_at: NaiveDateTime, ends_at: NaiveDateTime, pool: Pool<Postgres>) -> Result<Campaign> {
    let new_campaign = sqlx::query!
    (
        "
            INSERT INTO campaigns (id, name, description, starts_at, ends_at)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *
        ",
        id,
        name,
        description,
        starts_at,
        ends_at
    ).fetch_one(&pool).await;

    match new_campaign {
        Ok(res) => {
            Ok(
                Campaign {
                    id: res.id,
                    name: res.name,
                    cover_image: None,
                    description: res.description,
                    starts_at: res.starts_at.and_utc(),
                    ends_at: res.ends_at.and_utc()
                }
            )
        },
        Err(_) => bail!("error: failed to create campaign")
    }
}