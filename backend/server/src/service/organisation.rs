use crate::models::campaign::Campaign;
use crate::models::error::ChaosError;
use crate::models::organisation::{Member, MemberList, OrganisationDetails, OrganisationRole};
use chrono::{DateTime, Utc};
use snowflake::SnowflakeIdGenerator;
use sqlx::{Pool, Postgres, Transaction};
use std::ops::DerefMut;
use uuid::Uuid;

pub async fn is_admin(
    user_id: i64,
    organisation_id: i64,
    pool: &Pool<Postgres>,
) -> Result<(), ChaosError> {
    let is_admin = sqlx::query!(
        "SELECT EXISTS(SELECT 1 FROM organisation_members WHERE organisation_id = $1 AND user_id = $2 AND role = 'Admin')",
        organisation_id,
        user_id
    )
        .fetch_one(pool)
        .await?.exists.expect("`exists` should always exist in this query result");

    if !is_admin {
        return Err(ChaosError::UnauthorizedError);
    }

    Ok(())
}

pub async fn get_organisation(
    id: i64,
    pool: &Pool<Postgres>,
) -> Result<OrganisationDetails, ChaosError> {
    Ok(sqlx::query_as!(
        OrganisationDetails,
        "
            SELECT id, name, logo, created_at
                FROM organisations
                WHERE id = $1
        ",
        id
    )
    .fetch_one(pool)
    .await?)
}

pub async fn update_organisation_logo(
    id: i64,
    user_id: i64,
    pool: &Pool<Postgres>,
) -> Result<String, ChaosError> {
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
    .execute(pool)
    .await?;

    // TODO: Generate a s3 url
    let upload_url = "GENERATE AN S3 PRESIGNED URL".to_string();

    Ok(upload_url)
}

pub async fn delete_organisation(
    organisation_id: i64,
    pool: &Pool<Postgres>,
) -> Result<(), ChaosError> {
    sqlx::query!(
        "
            DELETE FROM organisations WHERE id = $1
        ",
        organisation_id
    )
    .execute(pool)
    .await?;

    Ok(())
}

pub async fn create_organisation(
    admin_id: i64,
    name: String,
    mut snowflake_generator: SnowflakeIdGenerator,
    transaction: &mut Transaction<'_, Postgres>,
) -> Result<(), ChaosError> {
    let id = snowflake_generator.generate();

    sqlx::query!(
        "
            INSERT INTO organisations (id, name)
                VALUES ($1, $2)
        ",
        id,
        name
    )
    .execute(transaction.deref_mut())
    .await?;

    sqlx::query!(
        "
            INSERT INTO organisation_members (organisation_id, user_id, role)
                VALUES ($1, $2, $3)
        ",
        id,
        admin_id,
        OrganisationRole::Admin as OrganisationRole
    )
    .execute(transaction.deref_mut())
    .await?;

    Ok(())
}

pub async fn get_organisation_members(
    organisation_id: i64,
    user_id: i64,
    pool: &Pool<Postgres>,
) -> Result<MemberList, ChaosError> {
    let admin_list = sqlx::query_as!(
        Member,
        "
            SELECT organisation_members.user_id as id, organisation_members.role AS \"role: OrganisationRole\", users.name from organisation_members
                LEFT JOIN users on users.id = organisation_members.user_id
                WHERE organisation_id = $1
        ",
        organisation_id
    )
    .fetch_all(pool)
    .await?;

    Ok(MemberList {
        members: admin_list,
    })
}

pub async fn update_organisation_admins(
    organisation_id: i64,
    user_id: i64,
    admin_id_list: Vec<i64>,
    transaction: &mut Transaction<'_, Postgres>,
) -> Result<(), ChaosError> {
    sqlx::query!(
        "DELETE FROM organisation_members WHERE organisation_id = $1 AND role = $2",
        organisation_id,
        OrganisationRole::Admin as OrganisationRole
    )
    .execute(transaction.deref_mut())
    .await?;

    for admin_id in admin_id_list {
        sqlx::query!(
            "
                INSERT INTO organisation_members (organisation_id, user_id, role)
                    VALUES ($1, $2, $3)
            ",
            organisation_id,
            admin_id,
            OrganisationRole::Admin as OrganisationRole
        )
        .execute(transaction.deref_mut())
        .await?;
    }

    Ok(())
}

pub async fn remove_admin_from_organisation(
    organisation_id: i64,
    user_id: i64,
    admin_to_remove: i64,
    pool: &Pool<Postgres>,
) -> Result<(), ChaosError> {
    sqlx::query!(
        "
            DELETE FROM organisation_members WHERE user_id = $1 AND organisation_id = $2
        ",
        admin_to_remove,
        organisation_id
    )
    .execute(pool)
    .await?;

    Ok(())
}

pub async fn get_organisation_campaigns(
    id: i64,
    pool: &Pool<Postgres>,
) -> Result<Vec<Campaign>, ChaosError> {
    Ok(sqlx::query_as!(
        Campaign,
        "
            SELECT id, name, cover_image, description, starts_at, ends_at
            FROM campaigns
            WHERE organisation_id = $1
        ",
        id
    )
    .fetch_all(pool)
    .await?)
}

pub async fn create_campaign_for_organisation(
    id: i64,
    name: String,
    description: Option<String>,
    starts_at: DateTime<Utc>,
    ends_at: DateTime<Utc>,
    pool: &Pool<Postgres>,
) -> Result<(), ChaosError> {
    sqlx::query!(
        "
            INSERT INTO campaigns (id, name, description, starts_at, ends_at)
                VALUES ($1, $2, $3, $4, $5)
        ",
        id,
        name,
        description,
        starts_at,
        ends_at
    )
    .execute(pool)
    .await?;

    Ok(())
}
