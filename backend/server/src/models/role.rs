//! Role management for Chaos campaigns.
//!
//! This module provides functionality for managing roles within recruitment campaigns,
//! including creation, updates, and retrieval of role information.

use crate::models::error::ChaosError;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use snowflake::SnowflakeIdGenerator;
use sqlx::{FromRow, Postgres, Transaction};
use std::env;
use std::ops::DerefMut;

/// Represents a role in a recruitment campaign.
///
/// A role defines a position that can be applied for within a campaign,
/// including its availability and status.
#[derive(Deserialize, Serialize, Clone, FromRow, Debug)]
pub struct Role {
    /// Unique identifier for the role
    #[serde(serialize_with = "crate::models::serde_string::serialize")]
    pub id: i64,
    /// ID of the campaign this role belongs to
    #[serde(serialize_with = "crate::models::serde_string::serialize")]
    pub campaign_id: i64,
    /// Optional name of the role
    pub name: Option<String>,
    /// Detailed description of the role
    pub description: String,
    /// Minimum number of positions available
    pub min_available: i32,
    /// Maximum number of positions available
    pub max_available: i32,
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
    pub max_available: i32,
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
    #[serde(serialize_with = "crate::models::serde_string::serialize")]
    pub id: i64,
    /// ID of the campaign this role belongs to
    #[serde(serialize_with = "crate::models::serde_string::serialize")]
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
        role_data.validate()?;
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
            role_data.max_available,
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
    pub async fn get(
        id: i64,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<RoleDetails, ChaosError> {
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
    pub async fn delete(
        id: i64,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<(), ChaosError> {
        sqlx::query!(
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
        role_data.validate()?;

        sqlx::query!(
            "
                UPDATE campaign_roles
                SET (name, description, min_available, max_available, finalised) = ($2, $3, $4, $5, $6)
                WHERE id = $1 RETURNING id
            ",
            id,
            role_data.name,
            role_data.description,
            role_data.min_available,
            role_data.max_available,
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

impl RoleUpdate {
    pub fn validate(&self) -> Result<(), ChaosError> {
        let role_name_max_chars = env::var("ROLE_NAME_MAX_CHARS")
            .expect("Error getting ROLE_NAME_MAX_CHARS")
            .to_string()
            .parse::<usize>()
            .map_err(|_| ChaosError::InternalServerError)?;
        let role_description_max_chars = env::var("ROLE_DESCRIPTION_MAX_CHARS")
            .expect("Error getting ROLE_DESCRIPTION_MAX_CHARS")
            .to_string()
            .parse::<usize>()
            .map_err(|_| ChaosError::InternalServerError)?;
        let role_positions_available_max = env::var("ROLE_POSITIONS_AVAILABLE_MAX")
            .expect("Error getting ROLE_POSITIONS_AVAILABLE_MAX")
            .to_string()
            .parse::<i32>()
            .map_err(|_| ChaosError::InternalServerError)?;

        if self.name.is_empty()
            || self.min_available < 0
            || self.max_available < 1
            || self.min_available > self.max_available
            || self.name.len() > role_name_max_chars
            || self.min_available > role_positions_available_max
            || self.max_available > role_positions_available_max
        {
            return Err(ChaosError::BadRequest);
        }

        if self.description.is_some()
            && self.description.as_ref().unwrap().len() > role_description_max_chars
        {
            return Err(ChaosError::BadRequest);
        }

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    // =========================================================================
    // TEST PLAN – Equivalence Partitioning (EP) & Boundary Value Analysis (BVA)
    // =========================================================================
    //
    // Functions under test
    //   · RoleUpdate::validate(&self) -> Result<(), ChaosError>
    //
    // validate() reads three limits from the environment
    // (ROLE_NAME_MAX_CHARS, ROLE_DESCRIPTION_MAX_CHARS, ROLE_POSITIONS_AVAILABLE_MAX),
    // so every test first pins them to fixed values via set_env(). It rejects the
    // update if ANY of: name empty, min<0, max<1, min>max, name too long, min or
    // max above the positions cap, or description too long.
    //
    // ── EQUIVALENCE PARTITIONING ──────────────────────────────────────────────
    //
    // validate – one class per rejection clause plus the accept class
    //
    //  ID    Field state                          Class            Expected          Test
    //  EP01  all fields in range                  valid            Ok(())            accepts_valid_role
    //  EP02  name = ""                            empty name       Err(BadRequest)   rejects_empty_name
    //  EP03  min_available = -1                   negative min     Err(BadRequest)   rejects_negative_min
    //  EP04  max_available = 0                    max below 1      Err(BadRequest)   rejects_max_below_one
    //  EP05  min > max (3 > 2)                    inverted range   Err(BadRequest)   rejects_min_greater_than_max
    //  EP06  name longer than cap                 name too long    Err(BadRequest)   rejects_overlong_name
    //  EP07  max above positions cap              over cap         Err(BadRequest)   rejects_positions_over_cap
    //  EP08  description longer than cap           desc too long    Err(BadRequest)   rejects_overlong_description
    //  EP09  description = None                    no description   Ok(())            accepts_valid_role
    //
    // ── BOUNDARY VALUE ANALYSIS ───────────────────────────────────────────────
    //
    // min_available (i32) – guard is `min_available < 0`, boundary at 0.
    //
    //  ID    Value   Expected          Test                    Status
    //  BV01  -1      Err(BadRequest)   rejects_negative_min    OK
    //  BV02  0       Ok(())            accepts_min_zero        OK
    //
    // max_available (i32) – guard is `max_available < 1`, boundary at 1.
    //
    //  ID    Value   Expected          Test                    Status
    //  BV03  0       Err(BadRequest)   rejects_max_below_one   OK
    //  BV04  1       Ok(())            accepts_max_one         OK
    //
    // name length vs ROLE_NAME_MAX_CHARS (=10 in tests) – guard is `len > cap`.
    //
    //  ID    Value       Expected          Test                    Status
    //  BV05  len 10      Ok(())            accepts_name_at_cap     OK
    //  BV06  len 11      Err(BadRequest)   rejects_overlong_name   OK
    //
    // ── KNOWN GAPS ────────────────────────────────────────────────────────────
    //
    //  · When an env limit is unset or non-numeric, validate() panics on the
    //    `.expect()` or returns InternalServerError from the parse map_err. These
    //    tests always set well-formed limits, so the misconfiguration paths are
    //    not exercised. Because the vars are process-global, these tests also
    //    assume no other test mutates ROLE_* concurrently.
    // =========================================================================

    use super::*;

    // ── helpers ──────────────────────────────────────────────────────────────

    /// Pins the three env limits validate() reads to fixed, well-formed values.
    fn set_env() {
        std::env::set_var("ROLE_NAME_MAX_CHARS", "10");
        std::env::set_var("ROLE_DESCRIPTION_MAX_CHARS", "20");
        std::env::set_var("ROLE_POSITIONS_AVAILABLE_MAX", "50");
    }

    /// A RoleUpdate that passes every clause; individual tests mutate one field.
    fn valid_role() -> RoleUpdate {
        RoleUpdate {
            name: "Reviewer".to_string(),
            description: None,
            min_available: 1,
            max_available: 5,
            finalised: false,
        }
    }

    // ── accept class ──────────────────────────────────────────────────────────

    /// White-box: an all-in-range update (no description) passes every guard.
    #[test]
    fn accepts_valid_role() {
        set_env();
        assert!(matches!(valid_role().validate(), Ok(())));
    }

    /// White-box: min_available = 0 sits on the accepted side of `< 0`.
    #[test]
    fn accepts_min_zero() {
        set_env();
        let role = RoleUpdate {
            min_available: 0,
            ..valid_role()
        };
        assert!(matches!(role.validate(), Ok(())));
    }

    /// White-box: max_available = 1 sits on the accepted side of `< 1`.
    #[test]
    fn accepts_max_one() {
        set_env();
        let role = RoleUpdate {
            min_available: 0,
            max_available: 1,
            ..valid_role()
        };
        assert!(matches!(role.validate(), Ok(())));
    }

    /// White-box: a name exactly at the cap length is not "too long".
    #[test]
    fn accepts_name_at_cap() {
        set_env();
        let role = RoleUpdate {
            name: "a".repeat(10),
            ..valid_role()
        };
        assert!(matches!(role.validate(), Ok(())));
    }

    // ── reject classes ────────────────────────────────────────────────────────

    /// White-box: an empty name trips the `name.is_empty()` clause.
    #[test]
    fn rejects_empty_name() {
        set_env();
        let role = RoleUpdate {
            name: String::new(),
            ..valid_role()
        };
        assert!(matches!(role.validate(), Err(ChaosError::BadRequest)));
    }

    /// White-box: a negative minimum trips the `min_available < 0` clause.
    #[test]
    fn rejects_negative_min() {
        set_env();
        let role = RoleUpdate {
            min_available: -1,
            ..valid_role()
        };
        assert!(matches!(role.validate(), Err(ChaosError::BadRequest)));
    }

    /// White-box: a maximum below one trips the `max_available < 1` clause.
    #[test]
    fn rejects_max_below_one() {
        set_env();
        let role = RoleUpdate {
            min_available: 0,
            max_available: 0,
            ..valid_role()
        };
        assert!(matches!(role.validate(), Err(ChaosError::BadRequest)));
    }

    /// White-box: min greater than max trips the `min > max` clause.
    #[test]
    fn rejects_min_greater_than_max() {
        set_env();
        let role = RoleUpdate {
            min_available: 3,
            max_available: 2,
            ..valid_role()
        };
        assert!(matches!(role.validate(), Err(ChaosError::BadRequest)));
    }

    /// White-box: a name one char over the cap trips the length clause.
    #[test]
    fn rejects_overlong_name() {
        set_env();
        let role = RoleUpdate {
            name: "a".repeat(11),
            ..valid_role()
        };
        assert!(matches!(role.validate(), Err(ChaosError::BadRequest)));
    }

    /// White-box: a maximum above the positions cap trips the cap clause.
    #[test]
    fn rejects_positions_over_cap() {
        set_env();
        let role = RoleUpdate {
            max_available: 51,
            ..valid_role()
        };
        assert!(matches!(role.validate(), Err(ChaosError::BadRequest)));
    }

    /// White-box: a description over its cap trips the second, description guard.
    #[test]
    fn rejects_overlong_description() {
        set_env();
        let role = RoleUpdate {
            description: Some("a".repeat(21)),
            ..valid_role()
        };
        assert!(matches!(role.validate(), Err(ChaosError::BadRequest)));
    }
}
