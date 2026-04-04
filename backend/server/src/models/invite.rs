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
    /// ID of the user that invited the member to the organisation
    #[serde(serialize_with = "crate::models::serde_string::serialize_option")]
    #[serde(deserialize_with = "crate::models::serde_string::deserialize_option")]
    pub invited_by_user_id: Option<i64>,
}

/// Response payload for invite details expected by the frontend.
#[derive(Serialize)]
pub struct InviteDetails {
    #[serde(serialize_with = "crate::models::serde_string::serialize")]
    pub id: i64,
    pub code: String,
    #[serde(serialize_with = "crate::models::serde_string::serialize")]
    pub organisation_id: i64,
    pub organisation_name: String,
    pub email: String,
    pub expires_at: DateTime<Utc>,
    pub used: bool,
    pub expired: bool,
    /// ID of the user that invited the member to the organisation
    #[serde(serialize_with = "crate::models::serde_string::serialize_option")]
    #[serde(deserialize_with = "crate::models::serde_string::deserialize_option")]
    pub invited_by_user_id: Option<i64>,
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
    ) -> Result<InviteDetails, ChaosError> {
        let invite = sqlx::query_as!(
            InviteDetails,
            r#"
                SELECT
                    oi.id,
                    code,
                    organisation_id,
                    o.name AS organisation_name,
                    email,
                    expires_at,
                    used_at IS NOT NULL AS "used!: bool",
                    expires_at <= NOW() AS "expired!: bool",
                    invited_by_user_id
                FROM organisation_invites oi
                JOIN organisations o ON o.id = oi.organisation_id
                WHERE code = $1 AND used_at IS NULL AND expires_at > NOW()
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
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<(), ChaosError> {
        sqlx::query!(
            r#"
                UPDATE organisation_invites
                SET used_at = $1, used_by = $2
                WHERE code = $3 AND used_at IS NULL AND expires_at > NOW()
                RETURNING id
            "#,
            Utc::now(),
            user_id,
            code,
        )
        .fetch_one(transaction.deref_mut())
        .await?;

        Ok(())
    }

    /// Deletes an invite by code.
    pub async fn delete_by_code(
        code: &str,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<(), ChaosError> {
        sqlx::query!(
            "DELETE FROM organisation_invites WHERE code = $1 RETURNING id",
            code
        )
        .fetch_one(transaction.deref_mut())
        .await?;

        Ok(())
    }
}
