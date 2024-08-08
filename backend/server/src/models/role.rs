use crate::models::error::ChaosError;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use snowflake::SnowflakeIdGenerator;
use sqlx::{FromRow, Pool, Postgres};

#[derive(Deserialize, Serialize, Clone, FromRow, Debug)]
pub struct Role {
    pub id: i64,
    pub campaign_id: i64,
    pub name: Option<String>,
    pub description: String,
    pub min_available: i32,
    pub max_avaliable: i32,
    pub finalised: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Deserialize, Serialize)]
pub struct RoleUpdate {
    pub name: String,
    pub description: Option<String>,
    pub min_available: i32,
    pub max_avaliable: i32,
    pub finalised: bool,
}

#[derive(Deserialize, Serialize)]
pub struct RoleDetails {
    pub id: i64,
    pub campaign_id: i64,
    pub name: String,
    pub description: Option<String>,
    pub min_available: i32,
    pub max_available: i32,
    pub finalised: bool,
}

impl Role {
    pub async fn create(
        campaign_id: i64,
        role_data: RoleUpdate,
        pool: &Pool<Postgres>,
        mut snowflake_generator: SnowflakeIdGenerator,
    ) -> Result<(), ChaosError> {
        let id = snowflake_generator.generate();

        sqlx::query!(
            "
                INSERT INTO campaign_roles (id, campaign_id, name, description, min_available, max_available, finalised)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            ",
            id,
            campaign_id,
            role_data.name,
            role_data.description,
            role_data.min_available,
            role_data.max_avaliable,
            role_data.finalised
        )
        .execute(pool)
        .await?;

        Ok(())
    }

    pub async fn get(id: i64, pool: &Pool<Postgres>) -> Result<RoleDetails, ChaosError> {
        let role = sqlx::query_as!(
            RoleDetails,
            "
                SELECT id, campaign_id, name, description, min_available, max_available, finalised
                FROM campaign_roles
                WHERE id = $1
            ",
            id
        )
        .fetch_one(pool)
        .await?;

        Ok(role)
    }

    pub async fn delete(id: i64, pool: &Pool<Postgres>) -> Result<(), ChaosError> {
        sqlx::query!(
            "
                DELETE FROM campaign_roles WHERE id = $1
            ",
            id
        )
        .execute(pool)
        .await?;

        Ok(())
    }

    pub async fn update(
        id: i64,
        role_data: RoleUpdate,
        pool: &Pool<Postgres>,
    ) -> Result<(), ChaosError> {
        let _ = sqlx::query!(
            "
                UPDATE campaign_roles
                SET (name, description, min_available, max_available, finalised) = ($2, $3, $4, $5, $6)
                WHERE id = $1
                RETURNING id;
            ",
            id,
            role_data.name,
            role_data.description,
            role_data.min_available,
            role_data.max_avaliable,
            role_data.finalised
        )
        .fetch_one(pool)
        .await?;

        Ok(())
    }

    /*
    Given a campaign id, return all existing roles in this campaign
     */
    pub async fn get_all_in_campaign(
        campaign_id: i64,
        pool: &Pool<Postgres>,
    ) -> Result<Vec<RoleDetails>, ChaosError> {
        let roles = sqlx::query_as!(
            RoleDetails,
            "
                SELECT id, campaign_id, name, description, min_available, max_available, finalised
                FROM campaign_roles
                WHERE campaign_id = $1
            ",
            campaign_id
        )
        .fetch_all(pool)
        .await?;

        Ok(roles)
    }
}
