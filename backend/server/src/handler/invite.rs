use crate::models::app::AppMessage;
use crate::models::auth::AuthUser;
use crate::models::error::ChaosError;
use crate::models::invite::Invite;
use crate::models::organisation::Organisation;
use crate::models::transaction::DBTransaction;
use crate::models::user::User;
use axum::extract::Path;
use axum::response::IntoResponse;

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
            return Err(ChaosError::BadRequestWithMessage(
                "Invite already used".to_string(),
            ));
        }
        if invite.expired {
            return Err(ChaosError::BadRequestWithMessage(
                "Invite expired".to_string(),
            ));
        }

        // Add the user to the organisation.
        Organisation::add_user(
            invite.organisation_id,
            auth_user.user_id,
            &mut transaction.tx,
        )
        .await?;

        // Mark the invite as used.
        Invite::mark_used(&code, auth_user.user_id, &mut transaction.tx).await?;

        transaction.tx.commit().await?;
        Ok(AppMessage::OkMessage("Invite accepted successfully"))
    }
}

#[cfg(test)]
mod tests {
    // =========================================================================
    // TEST PLAN – HTTP integration (handler + extractors + auth + DB)
    // =========================================================================
    //
    // Handlers driven through the real Router via oneshot against a #[sqlx::test] DB:
    //   · GET  /api/v1/invite/:code  -> get         (public, no auth)
    //   · POST /api/v1/invite/:code  -> use_invite  (AuthUser)
    //
    //  ID    Scenario                       Expected                          Test
    //  EP01  GET a live invite (no auth)    200 + invite details              get_returns_invite
    //  EP02  GET an unknown code            404                               get_unknown_code_is_404
    //  EP03  POST accept, no auth cookie    401                               use_requires_authentication
    //  EP04  POST accept, matching email    200, invite used + member added   matching_user_accepts_invite
    //  EP05  POST accept, wrong email       400, invite still unused          wrong_email_is_rejected
    // =========================================================================

    use super::*;
    use crate::test_support::*;
    use axum::http::StatusCode;
    use axum::routing::get;
    use axum::Router;
    use sqlx::PgPool;
    use tower::ServiceExt;

    const CODE: &str = "INVITE123";

    /// org 1 + a live invite (code INVITE123) addressed to invitee@test.com.
    async fn seed(pool: &PgPool) {
        seed_org(pool, 1, "org").await;
        sqlx::query(
            "INSERT INTO organisation_invites (id, organisation_id, code, email, expires_at)
             VALUES (500, 1, $1, 'invitee@test.com', NOW() + INTERVAL '1 day')",
        )
        .bind(CODE)
        .execute(pool)
        .await
        .unwrap();
    }

    fn router(pool: PgPool) -> Router {
        Router::new()
            .route(
                "/api/v1/invite/:code",
                get(InviteHandler::get).post(InviteHandler::use_invite),
            )
            .with_state(test_state(pool))
    }

    async fn invite_used(pool: &PgPool) -> bool {
        sqlx::query_scalar("SELECT used_at IS NOT NULL FROM organisation_invites WHERE id = 500")
            .fetch_one(pool)
            .await
            .unwrap()
    }

    /// White-box: the public GET returns the invite for a live code.
    #[sqlx::test(migrations = "../migrations")]
    async fn get_returns_invite(pool: PgPool) {
        seed(&pool).await;

        let response = router(pool.clone())
            .oneshot(request("GET", &format!("/api/v1/invite/{CODE}"), None, None))
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
        let json = body_json(response).await;
        assert_eq!(json["message"]["code"], serde_json::json!(CODE));
    }

    /// White-box: an unknown code surfaces the model's RowNotFound as 404.
    #[sqlx::test(migrations = "../migrations")]
    async fn get_unknown_code_is_404(pool: PgPool) {
        seed(&pool).await;

        let response = router(pool.clone())
            .oneshot(request("GET", "/api/v1/invite/NOPE", None, None))
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::NOT_FOUND);
    }

    /// White-box: accepting requires authentication.
    #[sqlx::test(migrations = "../migrations")]
    async fn use_requires_authentication(pool: PgPool) {
        seed(&pool).await;

        let response = router(pool.clone())
            .oneshot(request("POST", &format!("/api/v1/invite/{CODE}"), None, None))
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
        assert!(!invite_used(&pool).await);
    }

    /// White-box: the invitee (matching email) accepts — invite is marked used and
    /// the user joins the organisation.
    #[sqlx::test(migrations = "../migrations")]
    async fn matching_user_accepts_invite(pool: PgPool) {
        seed(&pool).await;
        seed_user(&pool, 1, "invitee@test.com").await;

        let response = router(pool.clone())
            .oneshot(request("POST", &format!("/api/v1/invite/{CODE}"), Some(1), None))
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
        assert!(invite_used(&pool).await, "invite should be marked used");
        let member: bool = sqlx::query_scalar(
            "SELECT EXISTS(SELECT 1 FROM organisation_members WHERE organisation_id = 1 AND user_id = 1)",
        )
        .fetch_one(&pool)
        .await
        .unwrap();
        assert!(member, "the user should have joined the organisation");
    }

    /// White-box: a user whose email differs from the invite is rejected (400) and
    /// the invite stays unused.
    #[sqlx::test(migrations = "../migrations")]
    async fn wrong_email_is_rejected(pool: PgPool) {
        seed(&pool).await;
        seed_user(&pool, 2, "someone-else@test.com").await;

        let response = router(pool.clone())
            .oneshot(request("POST", &format!("/api/v1/invite/{CODE}"), Some(2), None))
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::BAD_REQUEST);
        assert!(!invite_used(&pool).await, "invite must remain unused");
    }
}
