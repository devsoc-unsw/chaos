use crate::models::app::AppMessage;
use crate::models::auth::AuthUser;
use crate::models::error::ChaosError;
use crate::models::invite::Invite;
use crate::models::organisation::Organisation;
use crate::models::transaction::DBTransaction;
use axum::extract::Path;
use axum::response::IntoResponse;
use chrono::{DateTime, Utc};
use serde::Serialize;
use sqlx::query;
use std::ops::DerefMut;


/// Handler for invite-related HTTP requests.
pub struct InviteHandler;

impl InviteHandler {
    /// Gets invite details for a given invite code.
    ///
    /// # Arguments
    ///
    /// * `transaction` - Database transaction
    /// * `code` - Invite code
    ///
    /// # Returns
    ///
    /// * `Result<impl IntoResponse, ChaosError>` - Invite details or error
    pub async fn get(
        mut transaction: DBTransaction<'_>,
        Path(code): Path<String>,
    ) -> Result<impl IntoResponse, ChaosError> {
        let invite = Invite::get_by_code(&code, &mut transaction.tx).await?;
        let org = query!(
            "SELECT name FROM organisations WHERE id = $1",
            invite.organisation_id
        )
        .fetch_one(transaction.tx.deref_mut())
        .await?;

        // Include derived booleans expected by the frontend.
        let details = InviteDetails {
            organisation_id: invite.organisation_id,
            organisation_name: org.name,
            email: invite.email,
            expires_at: invite.expires_at,
            used: invite.used_at.is_some(),
            expired: invite.expires_at <= Utc::now(),
            invited_by_organisation_id: invite.invited_by_organisation_id,
        };

        transaction.tx.commit().await?;
        Ok(AppMessage::OkMessage(details))
    }

    /// Accepts an invite for the current authenticated user.
    ///
    /// Validates the invite is not expired/used, then marks it as used.
    ///
    /// # Arguments
    ///
    /// * `transaction` - Database transaction
    /// * `code` - Invite code
    /// * `user` - Authenticated user
    ///
    /// # Returns
    ///
    /// * `Result<impl IntoResponse, ChaosError>` - Success message or error
    pub async fn use_invite(
        mut transaction: DBTransaction<'_>,
        Path(code): Path<String>,
        user: AuthUser,
    ) -> Result<impl IntoResponse, ChaosError> {
        let invite = Invite::get_by_code(&code, &mut transaction.tx).await?;

        // Validate the invite is not already used or expired.
        if invite.used_at.is_some() {
            return Err(ChaosError::BadRequestWithMessage("Invite already used".to_string()));
        }
        if invite.expires_at <= Utc::now() {
            return Err(ChaosError::BadRequestWithMessage("Invite expired".to_string()));
        }

        // Add the user to the organisation.
        Organisation::add_user(invite.organisation_id, user.user_id, &mut transaction.tx).await?;

        // Mark the invite as used.
        Invite::mark_used(&code, user.user_id, invite.invited_by_organisation_id, &mut transaction.tx).await?;

        transaction.tx.commit().await?;
        Ok(AppMessage::OkMessage("Invite accepted successfully"))
    }

    
}

/// Response payload for invite details expected by the frontend.
#[derive(Serialize)]
pub struct InviteDetails {
    #[serde(serialize_with = "crate::models::serde_string::serialize")]
    pub organisation_id: i64,
    pub organisation_name: String,
    pub email: String,
    pub expires_at: DateTime<Utc>,
    pub used: bool,
    pub expired: bool,
    /// ID of the organisation that invited the user
    #[serde(serialize_with = "crate::models::serde_string::serialize_option")]
    #[serde(deserialize_with = "crate::models::serde_string::deserialize_option")]
    pub invited_by_organisation_id: Option<i64>
}