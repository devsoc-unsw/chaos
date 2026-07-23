//! User handler for the Chaos application.
//!
//! This module provides HTTP request handlers for managing user profiles, including:
//! - Retrieving user details
//! - Updating user information (name, pronouns, gender, zid, degree)

use crate::models::app::AppMessage;
use crate::models::auth::AuthUser;
use crate::models::error::ChaosError;
use crate::models::transaction::DBTransaction;
use crate::models::user::{
    User, UserDegree, UserGender, UserName, UserPronouns, UserRole, UserZid,
};
use axum::extract::Json;
use axum::http::StatusCode;
use axum::response::IntoResponse;

/// Handler for user-related HTTP requests.
pub struct UserHandler;

impl UserHandler {
    /// Retrieves the details of the current user.
    ///
    /// This handler allows authenticated users to view their profile details.
    ///
    /// # Arguments
    ///
    /// * `state` - The application state
    /// * `user` - The authenticated user
    ///
    /// # Returns
    ///
    /// * `Result<impl IntoResponse, ChaosError>` - User details or error
    pub async fn get(
        mut transaction: DBTransaction<'_>,
        user: AuthUser,
    ) -> Result<impl IntoResponse, ChaosError> {
        let user = User::get(user.user_id, &mut transaction.tx).await?;

        transaction.tx.commit().await?;
        Ok((StatusCode::OK, Json(user)))
    }

    /// Updates the user's name.
    ///
    /// This handler allows users to update their name.
    ///
    /// # Arguments
    ///
    /// * `state` - The application state
    /// * `user` - The authenticated user
    /// * `request_body` - The new name
    ///
    /// # Returns
    ///
    /// * `Result<impl IntoResponse, ChaosError>` - Success message or error
    pub async fn update_name(
        mut transaction: DBTransaction<'_>,
        user: AuthUser,
        Json(request_body): Json<UserName>,
    ) -> Result<impl IntoResponse, ChaosError> {
        User::update_name(user.user_id, request_body.name, &mut transaction.tx).await?;

        transaction.tx.commit().await?;
        Ok(AppMessage::OkMessage("Updated username"))
    }

    /// Updates the user's pronouns.
    ///
    /// This handler allows users to update their pronouns.
    ///
    /// # Arguments
    ///
    /// * `state` - The application state
    /// * `user` - The authenticated user
    /// * `request_body` - The new pronouns
    ///
    /// # Returns
    ///
    /// * `Result<impl IntoResponse, ChaosError>` - Success message or error
    pub async fn update_pronouns(
        mut transaction: DBTransaction<'_>,
        user: AuthUser,
        Json(request_body): Json<UserPronouns>,
    ) -> Result<impl IntoResponse, ChaosError> {
        User::update_pronouns(user.user_id, request_body.pronouns, &mut transaction.tx).await?;

        transaction.tx.commit().await?;
        Ok(AppMessage::OkMessage("Updated pronouns"))
    }

    /// Updates the user's gender.
    ///
    /// This handler allows users to update their gender.
    ///
    /// # Arguments
    ///
    /// * `state` - The application state
    /// * `user` - The authenticated user
    /// * `request_body` - The new gender
    ///
    /// # Returns
    ///
    /// * `Result<impl IntoResponse, ChaosError>` - Success message or error
    pub async fn update_gender(
        mut transaction: DBTransaction<'_>,
        user: AuthUser,
        Json(request_body): Json<UserGender>,
    ) -> Result<impl IntoResponse, ChaosError> {
        User::update_gender(user.user_id, request_body.gender, &mut transaction.tx).await?;

        transaction.tx.commit().await?;
        Ok(AppMessage::OkMessage("Updated gender"))
    }

    /// Updates the user's zid.
    ///
    /// This handler allows users to update their zid.
    ///
    /// # Arguments
    ///
    /// * `state` - The application state
    /// * `user` - The authenticated user
    /// * `request_body` - The new zid
    ///
    /// # Returns
    ///
    /// * `Result<impl IntoResponse, ChaosError>` - Success message or error
    pub async fn update_zid(
        mut transaction: DBTransaction<'_>,
        user: AuthUser,
        Json(request_body): Json<UserZid>,
    ) -> Result<impl IntoResponse, ChaosError> {
        User::update_zid(user.user_id, request_body.zid, &mut transaction.tx).await?;

        transaction.tx.commit().await?;
        Ok(AppMessage::OkMessage("Updated zid"))
    }

    /// Updates the user's degree information.
    ///
    /// This handler allows users to update their degree details.
    ///
    /// # Arguments
    ///
    /// * `state` - The application state
    /// * `user` - The authenticated user
    /// * `request_body` - The new degree details
    ///
    /// # Returns
    ///
    /// * `Result<impl IntoResponse, ChaosError>` - Success message or error
    pub async fn update_degree(
        mut transaction: DBTransaction<'_>,
        user: AuthUser,
        Json(request_body): Json<UserDegree>,
    ) -> Result<impl IntoResponse, ChaosError> {
        User::update_degree(
            user.user_id,
            request_body.degree_name,
            request_body.degree_starting_year,
            &mut transaction.tx,
        )
        .await?;

        transaction.tx.commit().await?;
        Ok(AppMessage::OkMessage("Updated user degree"))
    }

    /// Returns whether the current user is a superuser.
    pub async fn is_superuser(
        mut transaction: DBTransaction<'_>,
        user: AuthUser,
    ) -> Result<impl IntoResponse, ChaosError> {
        let user = User::get(user.user_id, &mut transaction.tx).await?;
        transaction.tx.commit().await?;
        let is_superuser = matches!(user.role, UserRole::SuperUser);
        Ok((
            StatusCode::OK,
            Json(serde_json::json!({ "is_superuser": is_superuser })),
        ))
    }
}

#[cfg(test)]
mod tests {
    // =========================================================================
    // TEST PLAN – HTTP integration (handler + extractors + auth + DB)
    // =========================================================================
    //
    // Handlers driven through the real Router via oneshot against a #[sqlx::test] DB:
    //   · GET   /api/v1/user               -> get           (AuthUser)
    //   · PATCH /api/v1/user/name          -> update_name   (AuthUser)
    //   · GET   /api/v1/user/is_superuser  -> is_superuser  (AuthUser)
    //
    //  ID    Scenario                       Expected                          Test
    //  EP01  GET self, no auth cookie       401                               get_requires_authentication
    //  EP02  GET self as authed user        200 + own profile                get_returns_current_user
    //  EP03  PATCH name then GET            the name is updated               update_name_round_trips
    //  EP04  is_superuser for normal user   false                            is_superuser_false_for_normal_user
    //  EP05  is_superuser for super user    true                             is_superuser_true_for_super_user
    //
    // KNOWN GAPS: the other profile PATCH handlers (pronouns/gender/zid/degree)
    // share update_name's wiring exactly and are not each driven.
    // =========================================================================

    use super::*;
    use crate::test_support::*;
    use axum::http::StatusCode;
    use axum::routing::{get, patch};
    use axum::Router;
    use sqlx::PgPool;
    use tower::ServiceExt;

    fn router(pool: PgPool) -> Router {
        Router::new()
            .route("/api/v1/user", get(UserHandler::get))
            .route("/api/v1/user/is_superuser", get(UserHandler::is_superuser))
            .route("/api/v1/user/name", patch(UserHandler::update_name))
            .with_state(test_state(pool))
    }

    /// White-box: fetching the current user requires authentication.
    #[sqlx::test(migrations = "../migrations")]
    async fn get_requires_authentication(pool: PgPool) {
        seed_user(&pool, 1, "u@test.com").await;

        let response = router(pool.clone())
            .oneshot(request("GET", "/api/v1/user", None, None))
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
    }

    /// White-box: an authed user reads their own profile (keyed by the JWT sub).
    #[sqlx::test(migrations = "../migrations")]
    async fn get_returns_current_user(pool: PgPool) {
        seed_user(&pool, 1, "u@test.com").await;

        let response = router(pool.clone())
            .oneshot(request("GET", "/api/v1/user", Some(1), None))
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
        let json = body_json(response).await;
        assert_eq!(json["email"], serde_json::json!("u@test.com"));
    }

    /// White-box: a name PATCH is persisted and reflected by a subsequent GET.
    #[sqlx::test(migrations = "../migrations")]
    async fn update_name_round_trips(pool: PgPool) {
        seed_user(&pool, 1, "u@test.com").await;

        let patch_resp = router(pool.clone())
            .oneshot(request(
                "PATCH",
                "/api/v1/user/name",
                Some(1),
                Some(serde_json::json!({ "name": "Renamed" })),
            ))
            .await
            .unwrap();
        assert_eq!(patch_resp.status(), StatusCode::OK);

        let json = body_json(
            router(pool.clone())
                .oneshot(request("GET", "/api/v1/user", Some(1), None))
                .await
                .unwrap(),
        )
        .await;
        assert_eq!(json["name"], serde_json::json!("Renamed"));
    }

    /// White-box: a normal user is not a superuser.
    #[sqlx::test(migrations = "../migrations")]
    async fn is_superuser_false_for_normal_user(pool: PgPool) {
        seed_user(&pool, 1, "u@test.com").await;

        let json = body_json(
            router(pool.clone())
                .oneshot(request("GET", "/api/v1/user/is_superuser", Some(1), None))
                .await
                .unwrap(),
        )
        .await;
        assert_eq!(json["is_superuser"], serde_json::json!(false));
    }

    /// White-box: a SuperUser-role user is reported as a superuser.
    #[sqlx::test(migrations = "../migrations")]
    async fn is_superuser_true_for_super_user(pool: PgPool) {
        seed_super_user(&pool, 2, "boss@test.com").await;

        let json = body_json(
            router(pool.clone())
                .oneshot(request("GET", "/api/v1/user/is_superuser", Some(2), None))
                .await
                .unwrap(),
        )
        .await;
        assert_eq!(json["is_superuser"], serde_json::json!(true));
    }
}
