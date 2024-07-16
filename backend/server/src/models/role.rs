use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use crate::models::error::ChaosError;
use sqlx::{FromRow, Pool, Postgres, Transaction};
use std::ops::DerefMut;

use super::campaign;

#[derive(Deserialize, Serialize, Clone, FromRow, Debug)]
pub struct Role {
    pub id: i32,
    pub campaign_id: i64,
    pub name: String,
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
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<(), ChaosError> {
        
        sqlx::query!(
            "
            INSERT INTO campaign_roles (campaign_id, name, description, min_available, max_available, finalised)
                VALUES ($1, $2, $3, $4, $5, $6)
        ",
            campaign_id,
            role_data.name,
            role_data.description,
            role_data.min_available,
            role_data.max_avaliable,
            role_data.finalised
        )
        .execute(transaction.deref_mut())
        .await?;

        Ok(())
    }

    pub async fn get(id: i32, pool: &Pool<Postgres>) -> Result<RoleDetails, ChaosError> {
        let role = sqlx::query_as!(
            RoleDetails,
            "
            SELECT name, description, min_available, max_available, finalised
                FROM campaign_roles
                WHERE id = $1
        ",
            id
        )
        .fetch_one(pool)
        .await?;

        Ok(role)
    }

    pub async fn delete(id: i32, pool: &Pool<Postgres>) -> Result<(), ChaosError> {
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
        id: i32,
        role_data: RoleUpdate,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<(), ChaosError> {
        sqlx::query!(
            "
            UPDATE campaign_roles
            SET (name, description, min_available, max_available, finalised) = ($2, $3, $4, $5, $6)
            WHERE id = $1;
        ",
            id,
            role_data.name,
            role_data.description,
            role_data.min_available,
            role_data.max_avaliable,
            role_data.finalised
        )
        .execute(transaction.deref_mut())
        .await?;

        Ok(())
    }


}