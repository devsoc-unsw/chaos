use anyhow::{bail, Error, Result};
use chrono::{DateTime, Local, NaiveDateTime, Utc};
use serde::{Deserialize, Serialize};
use snowflake::SnowflakeIdGenerator;
use sqlx::{Pool, Postgres};
use uuid::Uuid;

use crate::models::organisation::{Member, MemberList, OrganisationDetails};

pub async fn is_admin(user_id: i64, organisation_id: i64, pool: &Pool<Postgres>) -> Result<()> {
    let is_admin = sqlx::query!(
        "SELECT EXISTS(SELECT 1 FROM organisation_admins WHERE organisation_id = $1 AND user_id = $2)",
        organisation_id,
        user_id
    )
        .fetch_one(&pool)
        .await?.exists.unwrap();

    if !is_admin {
        bail!("User is not an admin of organisation");
    }

    Ok(())
}

pub async fn get_organisation(id: i64, pool: &Pool<Postgres>) -> Result<OrganisationDetails> {
    let response = sqlx::query_as!(
        OrganisationDetails,
        "
            SELECT id, name, logo, created_at
                FROM organisations
                WHERE id = $1
        ",
        id
    )
    .fetch_optional(&pool)
    .await?;

    if let Some(details) = response {
        return Ok(details);
    }

    bail!("error: failed to get organisation");
}

pub async fn update_organisation_logo(
    id: i64,
    user_id: i64,
    pool: &Pool<Postgres>,
) -> Result<String> {
    is_admin(user_id, id, pool).await?;

    let dt = Utc::now();

    let logo_id = Uuid::new_v4().to_string(); // TODO: Change db type to UUID
    let current_time = dt;
    sqlx::query!(
        "
            UPDATE organisations
                SET logo = $2, updated_at = $3
                WHERE id = $1
        ",
        id,
        logo_id,
        current_time
    )
    .execute(&pool)
    .await?;

    // TODO: Generate a s3 url
    let upload_url = "GENERATE AN S3 PRESIGNED URL".to_string();

    Ok(upload_url)
}

pub async fn delete_organisation(organisation_id: i64, pool: &Pool<Postgres>) -> Result<()> {
    // Delete organisation
    sqlx::query!(
        "
            DELETE FROM organisations WHERE id = $1
        ",
        organisation_id
    )
    .execute(&pool)
    .await?;

    Ok(())
}

pub async fn create_organisation(
    admin_id: i64,
    name: String,
    mut snowflake_generator: SnowflakeIdGenerator,
    pool: &Pool<Postgres>,
) -> Result<()> {
    let id = snowflake_generator.generate();

    sqlx::query!(
        "
            INSERT INTO organisations (id, name)
                VALUES ($1, $2)
        ",
        id,
        name
    )
    .execute(&pool)
    .await?;

    sqlx::query!(
        "
            INSERT INTO organisation_admins (organisation_id, user_id)
                VALUES ($1, $2)
        ",
        id,
        admin_id
    )
    .execute(&pool)
    .await?;

    Ok(())
}

pub async fn get_organisation_members(
    organisation_id: i64,
    user_id: i64,
    pool: &Pool<Postgres>,
) -> Result<MemberList> {
    is_admin(user_id, organisation_id, pool).await?;

    let admin_list = sqlx::query_as!(
        Member,
        "
            SELECT organisation_admins.user_id as id, users.name from organisation_admins
                LEFT JOIN users on users.id = organisation_admins.user_id
                WHERE organisation_id = $1
        ",
        organisation_id
    )
    .fetch_all(&pool)
    .await?;

    Ok(MemberList {
        members: admin_list,
    })
}

pub async fn update_organisation_admins(
    organisation_id: i64,
    user_id: i64,
    admin_id_list: Vec<i64>,
    pool: &Pool<Postgres>,
) -> Result<()> {
    is_admin(user_id, organisation_id, pool).await?;

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

    Ok(())
}

pub async fn remove_admin_from_organisation(
    organisation_id: i64,
    user_id: i64,
    admin_to_remove: i64,
    pool: &Pool<Postgres>,
) -> Result<()> {
    is_admin(user_id, organisation_id, pool).await?;

    sqlx::query!(
        "
            DELETE FROM organisation_admins WHERE user_id = $1 AND organisation_id = $2
        ",
        admin_to_remove,
        organisation_id
    )
    .execute(&pool)
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
    pub ends_at: NaiveDateTime,
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

pub async fn create_campaign_for_organisation(
    id: i64,
    name: String,
    description: String,
    starts_at: NaiveDateTime,
    ends_at: NaiveDateTime,
    pool: Pool<Postgres>,
) -> Result<(), Error> {
    sqlx::query!(
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
    )
    .fetch_one(&pool)
    .await?;

    Ok(())
}