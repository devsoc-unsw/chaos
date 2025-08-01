//! Role management for Chaos campaigns.
//! 
//! This module provides functionality for managing roles within recruitment campaigns,
//! including creation, updates, and retrieval of role information.

use crate::models::error::ChaosError;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use snowflake::SnowflakeIdGenerator;
use sqlx::{FromRow, Pool, Postgres, Transaction};
use std::ops::DerefMut;

/// Represents a role in a recruitment campaign.
/// 
/// A role defines a position that can be applied for within a campaign,
/// including its availability and status.
#[derive(Deserialize, Serialize, Clone, FromRow, Debug)]
pub struct Role {
    /// Unique identifier for the role
    pub id: i64,
    /// ID of the campaign this role belongs to
    pub campaign_id: i64,
    /// Optional name of the role
    pub name: Option<String>,
    /// Detailed description of the role
    pub description: String,
    /// Minimum number of positions available
    pub min_available: i32,
    /// Maximum number of positions available
    pub max_avaliable: i32,
    /// Whether the role details have been finalized
    pub finalised: bool,
    /// When the role was created
    pub created_at: DateTime<Utc>,
    /// When the role was last updated
    pub updated_at: DateTime<Utc>,
}

/// Data structure for updating an existing role.
/// 
/// This struct contains the fields that can be modified for a role,
/// excluding system-managed fields like IDs and timestamps.
#[derive(Deserialize, Serialize)]
pub struct RoleUpdate {
    /// Name of the role
    pub name: String,
    /// Optional detailed description of the role
    pub description: Option<String>,
    /// Minimum number of positions available
    pub min_available: i32,
    /// Maximum number of positions available
    pub max_avaliable: i32,
    /// Whether the role details have been finalized
    pub finalised: bool,
}

/// Detailed view of a role's information.
/// 
/// This struct provides a complete view of a role's details,
/// used primarily for API responses.
#[derive(Deserialize, Serialize)]
pub struct RoleDetails {
    /// Unique identifier for the role
    pub id: i64,
    /// ID of the campaign this role belongs to
    pub campaign_id: i64,
    /// Name of the role
    pub name: String,
    /// Optional detailed description of the role
    pub description: Option<String>,
    /// Minimum number of positions available
    pub min_available: i32,
    /// Maximum number of positions available
    pub max_available: i32,
    /// Whether the role details have been finalized
    pub finalised: bool,
}

impl Role {
    /// Creates a new role in a campaign.
    /// 
    /// # Arguments
    /// * `campaign_id` - The ID of the campaign to create the role in
    /// * `role_data` - The data for the new role
    /// * `transaction` - A mutable reference to the database transaction
    /// * `snowflake_generator` - A generator for creating unique IDs
    /// 
    /// # Returns
    /// Returns a `Result` containing either:
    /// * `Ok(())` - If the role was created successfully
    /// * `Err(ChaosError)` - An error if creation fails
    pub async fn create(
        campaign_id: i64,
        role_data: RoleUpdate,
        transaction: &mut Transaction<'_, Postgres>,
        snowflake_generator: &mut SnowflakeIdGenerator,
    ) -> Result<i64, ChaosError> {
        let id = snowflake_generator.real_time_generate();

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
        .execute(transaction.deref_mut())
        .await?;

        Ok(id)
    }

    /// Retrieves a role by its ID.
    /// 
    /// # Arguments
    /// * `id` - The ID of the role to retrieve
    /// * `pool` - A reference to the database connection pool
    /// 
    /// # Returns
    /// Returns a `Result` containing either:
    /// * `Ok(RoleDetails)` - The requested role details
    /// * `Err(ChaosError)` - An error if retrieval fails
    pub async fn get(id: i64, transaction: &mut Transaction<'_, Postgres>,) -> Result<RoleDetails, ChaosError> {
        let role = sqlx::query_as!(
            RoleDetails,
            "
                SELECT id, campaign_id, name, description, min_available, max_available, finalised
                FROM campaign_roles
                WHERE id = $1
            ",
            id
        )
        .fetch_one(transaction.deref_mut())
        .await?;

        Ok(role)
    }

    /// Deletes a role.
    /// 
    /// # Arguments
    /// * `id` - The ID of the role to delete
    /// * `pool` - A reference to the database connection pool
    /// 
    /// # Returns
    /// Returns a `Result` containing either:
    /// * `Ok(())` - If the role was deleted successfully
    /// * `Err(ChaosError)` - An error if deletion fails
    pub async fn delete(id: i64, transaction: &mut Transaction<'_, Postgres>,) -> Result<(), ChaosError> {
        let _ = sqlx::query!(
            "
                DELETE FROM campaign_roles WHERE id = $1 RETURNING id
            ",
            id
        )
        .fetch_one(transaction.deref_mut())
        .await?;

        Ok(())
    }

    /// Updates an existing role.
    /// 
    /// # Arguments
    /// * `id` - The ID of the role to update
    /// * `role_data` - The new data for the role
    /// * `pool` - A reference to the database connection pool
    /// 
    /// # Returns
    /// Returns a `Result` containing either:
    /// * `Ok(())` - If the role was updated successfully
    /// * `Err(ChaosError)` - An error if update fails
    pub async fn update(
        id: i64,
        role_data: RoleUpdate,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<(), ChaosError> {
        let _ = sqlx::query!(
            "
                UPDATE campaign_roles
                SET (name, description, min_available, max_available, finalised) = ($2, $3, $4, $5, $6)
                WHERE id = $1 RETURNING id
            ",
            id,
            role_data.name,
            role_data.description,
            role_data.min_available,
            role_data.max_avaliable,
            role_data.finalised
        )
        .fetch_one(transaction.deref_mut())
        .await?;

        Ok(())
    }

    /// Retrieves all roles in a specific campaign.
    /// 
    /// # Arguments
    /// * `campaign_id` - The ID of the campaign to get roles from
    /// * `transaction` - A mutable reference to the database transaction
    /// 
    /// # Returns
    /// Returns a `Result` containing either:
    /// * `Ok(Vec<RoleDetails>)` - List of roles in the campaign
    /// * `Err(ChaosError)` - An error if retrieval fails
    pub async fn get_all_in_campaign(
        campaign_id: i64,
        transaction: &mut Transaction<'_, Postgres>,
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
        .fetch_all(transaction.deref_mut())
        .await?;

        Ok(roles)
    }
}
