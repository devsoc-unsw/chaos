use crate::models::app::AppMessage;
use crate::models::auth::AuthUser;
use crate::models::error::ChaosError;
use crate::models::invite::Invite;
use crate::models::organisation::Organisation;
use crate::models::transaction::DBTransaction;
use crate::models::user::User;
use axum::extract::Path;
use axum::response::IntoResponse;
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

        transaction.tx.commit().await?;
        Ok(AppMessage::OkMessage(invite))
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
        auth_user: AuthUser,
    ) -> Result<impl IntoResponse, ChaosError> {
        let invite = Invite::get_by_code(&code, &mut transaction.tx).await?;

        // Ensure the invite can only be accepted by the account whose email matches the invite email.
        // This prevents someone from accepting an invite intended for a different email address.
        let user = User::get(auth_user.user_id, &mut transaction.tx).await?;

        if user.email != invite.email {
            return Err(ChaosError::BadRequestWithMessage(
                "Invite was sent for a different email address".to_string(),
            ));
        }

        // Validate the invite is not already used or expired.
        if invite.used {
            return Err(ChaosError::BadRequestWithMessage("Invite already used".to_string()));
        }
        if invite.expired {
            return Err(ChaosError::BadRequestWithMessage("Invite expired".to_string()));
        }

        // Add the user to the organisation.
        Organisation::add_user(invite.organisation_id, auth_user.user_id, &mut transaction.tx).await?;

        // Mark the invite as used.
        Invite::mark_used(&code, auth_user.user_id, &mut transaction.tx).await?;

        transaction.tx.commit().await?;
        Ok(AppMessage::OkMessage("Invite accepted successfully"))
    }

    
}