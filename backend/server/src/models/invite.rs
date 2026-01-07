use crate::models::error::ChaosError;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{Postgres, Transaction};
use std::ops::DerefMut;

/// Represents an organisation invite.
#[derive(Deserialize, Serialize, sqlx::FromRow, Clone, Debug)]
pub struct Invite {
    /// Unique identifier for the invite
    #[serde(serialize_with = "crate::models::serde_string::serialize")]
    #[serde(deserialize_with = "crate::models::serde_string::deserialize")]
    pub id: i64,
    /// Unique invite code (used by invite URL)
    pub code: String,
    /// Organisation being invited to
    #[serde(serialize_with = "crate::models::serde_string::serialize")]
    #[serde(deserialize_with = "crate::models::serde_string::deserialize")]
    pub organisation_id: i64,
    /// Email address the invite was sent to
    pub email: String,
    /// When the invite expires
    pub expires_at: DateTime<Utc>,
    /// When the invite was used (if used)
    pub used_at: Option<DateTime<Utc>>,
    /// User who used the invite (if used)
    #[serde(serialize_with = "crate::models::serde_string::serialize_option")]
    #[serde(deserialize_with = "crate::models::serde_string::deserialize_option")]
    pub used_by: Option<i64>,
    /// When the invite was created
    pub created_at: DateTime<Utc>,
    /// ID of the organisation that invited the user
    #[serde(serialize_with = "crate::models::serde_string::serialize_option")]
    #[serde(deserialize_with = "crate::models::serde_string::deserialize_option")]
    pub invited_by_organisation_id: Option<i64>,
    
}

impl Invite {
    /// Fetches an invite by its code.
    ///
    /// # Arguments
    ///
    /// * `code` - Invite code
    /// * `transaction` - Database transaction to use
    ///
    /// # Returns
    ///
    /// * `Result<Invite, ChaosError>` - Invite row or error
    pub async fn get_by_code(
        code: &str,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<Invite, ChaosError> {
        let invite = sqlx::query_as!(
            Invite,
            r#"
                SELECT
                    id,
                    code,
                    organisation_id,
                    email,
                    expires_at,
                    used_at,
                    used_by,
                    created_at,
                    invited_by_organisation_id
                FROM organisation_invites
                WHERE code = $1
            "#,
            code
        )
        .fetch_one(transaction.deref_mut())
        .await?;

        Ok(invite)
    }

    /// Marks an invite as used by a user.
    ///
    /// # Arguments
    ///
    /// * `code` - Invite code
    /// * `user_id` - User redeeming the invite
    /// * `transaction` - Database transaction to use
    ///
    /// # Returns
    ///
    /// * `Result<(), ChaosError>` - Ok on success
    pub async fn mark_used(
        code: &str,
        user_id: i64,
        invited_by_organisation_id: Option<i64>,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<(), ChaosError> {
        sqlx::query!(
            r#"
                UPDATE organisation_invites
                SET used_at = $1, used_by = $2
                WHERE code = $3 AND invited_by_organisation_id = $4
            "#,
            Utc::now(),
            user_id,
            code,
            invited_by_organisation_id
        )
        .execute(transaction.deref_mut())
        .await?;

        Ok(())
    }

    /// Deletes an invite by code.
    pub async fn delete_by_code(
        code: &str,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<(), ChaosError> {
        sqlx::query!(
            "DELETE FROM organisation_invites WHERE code = $1",
            code
        )
        .execute(transaction.deref_mut())
        .await?;

        Ok(())
    }


}