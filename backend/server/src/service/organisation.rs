use anyhow::{bail, Error, Result};
use sqlx::{Pool, Postgres};
use chrono::{DateTime, Local, NaiveDateTime, Utc};
use serde::{Deserialize, Serialize};

use crate::models::organisation::OrganisationDetails;

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


pub async fn update_organisation_logo(id: i64, logo: String, pool: Pool<Postgres>) -> Result<()> {
    let dt = Local::now();
    let current_time = dt.naive_utc();
    sqlx::query!
    (
        "
            UPDATE organisations
                SET logo = $2, updated_at = $3
                WHERE id = $1
        ",
        id,
        logo,
        current_time
    ).fetch_one(&pool)
    .await?;

    Ok(())
}

pub async fn delete_organisation(organisation_id: i64, admin_id: i64, pool: Pool<Postgres>) -> Result<()> {
   // Delete organisation
   sqlx::query!
   (
        "
            CASCADE DELETE FROM organisations WHERE id = $1
                RETURNING *
        ",
        organisation_id
    ).fetch_one(&pool)
    .await?;

    Ok(())
}

pub async fn create_organisation(id: i64, name: String, pool: Pool<Postgres>) -> Result<(), Error> {
    sqlx::query!
    (
        "
            INSERT INTO organisations (id, name)
                VALUES ($1, $2)
        ",
        id,
        name
    ).fetch_one(&pool)
    .await?;
    
    Ok(())
}

// Below returns subset of user - not completed yet - remove comment when done
pub async fn get_organisation_admins(organisation_id: i64, pool: Pool<Postgres>) -> Result<Vec<Member>> {
    let admin_list = sqlx::query!
    (
        "
            SELECT organisation_admins
                FROM organisations
                WHERE id = $1
        "
        , organisation_id
    ).fetch_all(&pool).await?;

    let admin_id_list: Vec<i64> = admin_list.into_iter().map(|row| row.user_id).collect();

    if admin_id_list.is_empty() {
        return Ok(Vec::new());
    }

    let mut users = Vec::new();

    for id in admin_id_list {
        users.push(
            sqlx::query_as!(
                Member,
                "
                    SELECT id, name
                    FROM users
                    WHERE id = $1
                "
                , id
            )
            .fetch_one(&pool)
            .await?
        )
    }

    Ok(users)
}

pub async fn update_organisation_admins(organisation_id: i64, admin_id_list: Vec<i64>, pool: Pool<Postgres>) -> Result<(), Error> {
    sqlx::query!(
        "
            UPDATE organisations
            SET organisation_admins = $1
            WHERE id = $2
        ",
        &admin_ids,
        organisation_id
    )
    .execute(pool)
    .await?;
    
    Ok(())
}

pub async fn remove_admin_from_organisation(organisation_id: i64, admin_id: i64, pool: Pool<Postgres>) -> Result<(), Error> {
    sqlx::query!(
        "
            UPDATE organisations
            SET organisation_admins = array_remove(organisation_admins, $1)
            WHERE id = $2
        ",
        admin_id,
        organisation_id
    )
    .execute(pool)
    .await?;
    
    Ok(())
}

// This is only here as a placeholder - replace when campaign is done
#[derive(Deserialize, Serialize)]
pub struct Campaign {
    // Define your struct fields based on the Campaign model
    // For example:
    pub id: i64,
    pub name: String,
    pub cover_image: Option<String>,
    pub description: String,
    pub starts_at: NaiveDateTime,
    pub ends_at: NaiveDateTime
}

impl Campaign {
    fn into_utc(self) -> Self {
        Self {
            starts_at: DateTime::from_utc(self.starts_at, Utc),
            ends_at: DateTime::from_utc(self.ends_at, Utc),
            ..self
        }
    }
}

pub async fn get_organisation_campaigns(id: i64, pool: Pool<Postgres>) -> Result<Vec<Campaign>> {
    let campaigns = sqlx::query_as!(
        Campaign,
        "
            SELECT id, name, cover_image, description, starts_at, ends_at
            FROM campaigns
            WHERE organisation_id = $1
        ",
        id
    )
    .fetch_all(&pool)
    .await?;

    Ok(campaigns)
}

pub async fn create_campaign_for_organisation(id: i64, name: String, description: String, starts_at: NaiveDateTime, ends_at: NaiveDateTime, pool: Pool<Postgres>) -> Result<(), Error> {
    sqlx::query!
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
    ).fetch_one(&pool).await?;

    Ok(())
}