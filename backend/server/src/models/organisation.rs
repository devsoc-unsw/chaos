use crate::models::campaign::OrganisationCampaign;
use crate::models::error::ChaosError;
use crate::models::storage::Storage;
use chrono::{DateTime, Utc};
use s3::Bucket;
use serde::{Deserialize, Serialize};
use snowflake::SnowflakeIdGenerator;
use sqlx::{FromRow, Pool, Postgres, Transaction};
use std::ops::DerefMut;
use uuid::Uuid;

#[derive(Deserialize, Serialize, Clone, FromRow, Debug)]
pub struct Organisation {
    pub id: i64,
    pub slug: String,
    pub name: String,
    pub logo: Option<Uuid>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub campaigns: Vec<OrganisationCampaign>, // Awaiting Campaign to be complete - remove comment once done
    pub organisation_admins: Vec<i64>,
}

#[derive(Deserialize, Serialize)]
pub struct NewOrganisation {
    pub slug: String,
    pub name: String,
    pub admin: i64,
}

#[derive(Deserialize, Serialize)]
pub struct OrganisationDetails {
    pub id: i64,
    pub slug: String,
    pub name: String,
    pub logo: Option<Uuid>,
    pub created_at: DateTime<Utc>,
}

#[derive(Deserialize, Serialize, sqlx::Type, Clone)]
#[sqlx(type_name = "organisation_role", rename_all = "PascalCase")]
pub enum OrganisationRole {
    User,
    Admin,
}

#[derive(Deserialize, Serialize, FromRow)]
pub struct Member {
    pub id: i64,
    pub name: String,
    pub role: OrganisationRole,
}

#[derive(Deserialize, Serialize)]
pub struct MemberList {
    pub members: Vec<Member>,
}

#[derive(Deserialize, Serialize)]
pub struct AdminUpdateList {
    pub members: Vec<i64>,
}

#[derive(Deserialize, Serialize)]
pub struct AdminToRemove {
    pub user_id: i64,
}

impl Organisation {
    pub async fn create(
        admin_id: i64,
        slug: String,
        name: String,
        mut snowflake_generator: SnowflakeIdGenerator,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<(), ChaosError> {
        let id = snowflake_generator.generate();

        sqlx::query!(
            "
            INSERT INTO organisations (id, slug, name)
                VALUES ($1, $2, $3)
        ",
            id,
            slug,
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

    pub async fn get(id: i64, pool: &Pool<Postgres>) -> Result<OrganisationDetails, ChaosError> {
        let organisation = sqlx::query_as!(
            OrganisationDetails,
            "
            SELECT id, slug, name, logo, created_at
                FROM organisations
                WHERE id = $1
        ",
            id
        )
        .fetch_one(pool)
        .await?;

        Ok(organisation)
    }

    pub async fn delete(id: i64, pool: &Pool<Postgres>) -> Result<(), ChaosError> {
        _ = sqlx::query!(
            "
            DELETE FROM organisations WHERE id = $1 RETURNING id
        ",
            id
        )
        .fetch_one(pool)
        .await?;

        Ok(())
    }

    pub async fn get_admins(
        organisation_id: i64,
        pool: &Pool<Postgres>,
    ) -> Result<MemberList, ChaosError> {
        let admin_list = sqlx::query_as!(
        Member,
        "
            SELECT organisation_members.user_id as id, organisation_members.role AS \"role: OrganisationRole\", users.name from organisation_members
                LEFT JOIN users on users.id = organisation_members.user_id
                WHERE organisation_members.organisation_id = $1 AND organisation_members.role = $2
        ",
        organisation_id,
            OrganisationRole::Admin as OrganisationRole
    )
            .fetch_all(pool)
            .await?;

        Ok(MemberList {
            members: admin_list,
        })
    }

    pub async fn get_members(
        organisation_id: i64,
        pool: &Pool<Postgres>,
    ) -> Result<MemberList, ChaosError> {
        let admin_list = sqlx::query_as!(
        Member,
        "
            SELECT organisation_members.user_id as id, organisation_members.role AS \"role: OrganisationRole\", users.name from organisation_members
                LEFT JOIN users on users.id = organisation_members.user_id
                WHERE organisation_members.organisation_id = $1
        ",
        organisation_id
    )
            .fetch_all(pool)
            .await?;

        Ok(MemberList {
            members: admin_list,
        })
    }

    pub async fn update_admins(
        organisation_id: i64,
        admin_id_list: Vec<i64>,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<(), ChaosError> {
        let _ = sqlx::query!(
            "SELECT id FROM organisations WHERE id = $1",
            organisation_id
        )
        .fetch_one(transaction.deref_mut())
        .await?;

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

    pub async fn update_members(
        organisation_id: i64,
        member_id_list: Vec<i64>,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<(), ChaosError> {
        let _ = sqlx::query!(
            "SELECT id FROM organisations WHERE id = $1",
            organisation_id
        )
        .fetch_one(transaction.deref_mut())
        .await?;

        sqlx::query!(
            "DELETE FROM organisation_members WHERE organisation_id = $1 AND role = $2",
            organisation_id,
            OrganisationRole::User as OrganisationRole
        )
        .execute(transaction.deref_mut())
        .await?;

        for member_id in member_id_list {
            sqlx::query!(
                "
                INSERT INTO organisation_members (organisation_id, user_id, role)
                    VALUES ($1, $2, $3)
            ",
                organisation_id,
                member_id,
                OrganisationRole::User as OrganisationRole
            )
            .execute(transaction.deref_mut())
            .await?;
        }

        Ok(())
    }

    pub async fn remove_admin(
        organisation_id: i64,
        admin_to_remove: i64,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<(), ChaosError> {
        let _ = sqlx::query!(
            "SELECT id FROM organisations WHERE id = $1",
            organisation_id
        )
        .fetch_one(transaction.deref_mut())
        .await?;

        sqlx::query!(
            "
            UPDATE organisation_members SET role = $3 WHERE user_id = $1 AND organisation_id = $2
        ",
            admin_to_remove,
            organisation_id,
            OrganisationRole::User as OrganisationRole
        )
        .execute(transaction.deref_mut())
        .await?;

        Ok(())
    }

    pub async fn remove_member(
        organisation_id: i64,
        user_id: i64,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<(), ChaosError> {
        let _ = sqlx::query!(
            "SELECT id FROM organisations WHERE id = $1",
            organisation_id
        )
        .fetch_one(transaction.deref_mut())
        .await?;

        sqlx::query!(
            "
            DELETE FROM organisation_members WHERE user_id = $1 AND organisation_id = $2
        ",
            user_id,
            organisation_id
        )
        .execute(transaction.deref_mut())
        .await?;

        Ok(())
    }

    pub async fn update_logo(
        id: i64,
        pool: &Pool<Postgres>,
        storage_bucket: &Bucket,
    ) -> Result<String, ChaosError> {
        let dt = Utc::now();

        let logo_id = Uuid::new_v4();
        let current_time = dt;
        _ = sqlx::query!(
            "
            UPDATE organisations
                SET logo = $2, updated_at = $3
                WHERE id = $1 RETURNING id
        ",
            id,
            logo_id,
            current_time
        )
        .fetch_one(pool)
        .await?;

        let upload_url =
            Storage::generate_put_url(format!("/logo/{id}/{logo_id}"), storage_bucket).await?;

        Ok(upload_url)
    }

    pub async fn get_campaigns(
        organisation_id: i64,
        pool: &Pool<Postgres>,
    ) -> Result<Vec<OrganisationCampaign>, ChaosError> {
        let campaigns = sqlx::query_as!(
            OrganisationCampaign,
            "
                SELECT id, slug, name, cover_image, description, starts_at, ends_at
                FROM campaigns
                WHERE organisation_id = $1
            ",
            organisation_id
        )
        .fetch_all(pool)
        .await?;

        Ok(campaigns)
    }

    pub async fn create_campaign(
        organisation_id: i64,
        slug: String,
        name: String,
        description: Option<String>,
        starts_at: DateTime<Utc>,
        ends_at: DateTime<Utc>,
        pool: &Pool<Postgres>,
        mut snowflake_id_generator: SnowflakeIdGenerator,
    ) -> Result<(), ChaosError> {
        let new_campaign_id = snowflake_id_generator.real_time_generate();

        sqlx::query!(
            "
            INSERT INTO campaigns (id, organisation_id, slug, name, description, starts_at, ends_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
        ",
            new_campaign_id,
            organisation_id,
            slug,
            name,
            description,
            starts_at,
            ends_at
        )
        .execute(pool)
        .await?;

        Ok(())
    }

    pub async fn create_email_template(organisation_id: i64, name: String, template: String, pool: &Pool<Postgres>, mut snowflake_generator: SnowflakeIdGenerator,) -> Result<i64, ChaosError> {
        let id = snowflake_generator.generate();

        let _ = sqlx::query!(
            "
                INSERT INTO email_templates (id, organisation_id, name, template)
                    VALUES ($1, $2, $3, $4)
            ",
            id, organisation_id,
            name, template
        )
            .execute(pool)
            .await?;

        Ok(id)
    }
}
