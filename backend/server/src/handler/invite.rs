use crate::models::error::ChaosError;
use sqlx::Postgres;
use chrono::Utc;
use crate::models::invite::Invite;
use crate::models::transaction::DBTransaction;
use axum::response::IntoResponse;


/// Handler for invite-related HTTP requests.
pub struct InviteHandler;

impl InviteHandler {
    /// Validates whether an invite code is still valid (i.e. not expired).
    ///
    /// # Arguments
    ///
    /// * `code` - The invite code to validate
    /// * `transaction` - Database transaction to use
    ///
    /// # Returns
    ///
    /// * `Result<Invite, ChaosError>` - `Ok(invite)` if valid, `Err` if lookup fails
    pub async fn validate_invite_is_valid(
        code: &str,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<Invite, ChaosError> {
        let invite = Invite::get(code, transaction).await?;
        // check if the invite has already been used
        if invite.used_at.is_some() {
            return Err(ChaosError::BadRequestWithMessage(
                "Invite already used".to_string(),
            ));
        }
        // check if the invite has expired
        if invite.expires_at <= Utc::now() {
            return Err(ChaosError::BadRequestWithMessage(
                "Invite expired".to_string(),
            ));
        }
        Ok(invite)
    }
    

    /// Uses an invite code for a user.
    ///
    /// Validates the invite, marks it as used by the given user
    ///
    /// # Arguments
    ///
    /// * `code` - The invite code being redeemed
    /// * `user_id` - The ID of the user redeeming the invite
    /// * `transaction` - Database transaction to use
    ///
    /// # Returns
    ///
    /// * `Result<impl IntoResponse, ChaosError>` - `Ok(())` if the invite was used; `Err` if the invite is invalid
    pub async fn use_invite(
        code: &str,
        user_id: i64,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<impl IntoResponse, ChaosError> {

        let invite = Self::validate_invite_is_valid(code, transaction).await?;

        Invite::save_used_by_person(user_id, &invite, transaction).await?;

        transaction.tx.commit().await?;

        Ok((StatusCode::OK, AppMessage::OkMessage("Invite used successfully")))
    }

    pub async fn get_code_by_id(
        invite_id: i64,
        transaction: &mut DBTransaction<'_>,
    ) -> Result<String, ChaosError> {
        let invite = Invite::get(invite_id, &mut transaction.tx).await?;
        Ok(invite.code)
    }
}