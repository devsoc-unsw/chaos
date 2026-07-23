//! Role handler for the Chaos application.
//!
//! This module provides HTTP request handlers for managing campaign roles, including:
//! - Retrieving role details
//! - Updating and deleting roles
//! - Managing role applications

use crate::models::app::AppMessage;
use crate::models::application::Application;
use crate::models::auth::{AuthUser, RoleAdmin};
use crate::models::error::ChaosError;
use crate::models::role::{Role, RoleUpdate};
use crate::models::transaction::DBTransaction;
use axum::extract::{Json, Path};
use axum::http::StatusCode;
use axum::response::IntoResponse;

/// Handler for role-related HTTP requests.
pub struct RoleHandler;

impl RoleHandler {
    /// Retrieves the details of a specific role.
    ///
    /// This handler allows any authenticated user to view role details.
    ///
    /// # Arguments
    ///
    /// * `state` - The application state
    /// * `id` - The ID of the role to retrieve
    /// * `_user` - The authenticated user
    ///
    /// # Returns
    ///
    /// * `Result<impl IntoResponse, ChaosError>` - Role details or error
    pub async fn get(
        mut transaction: DBTransaction<'_>,
        Path(id): Path<i64>,
        _user: AuthUser,
    ) -> Result<impl IntoResponse, ChaosError> {
        let role = Role::get(id, &mut transaction.tx).await?;

        transaction.tx.commit().await?;
        Ok((StatusCode::OK, Json(role)))
    }

    /// Deletes a role.
    ///
    /// This handler allows role admins to delete roles.
    ///
    /// # Arguments
    ///
    /// * `state` - The application state
    /// * `id` - The ID of the role to delete
    /// * `_admin` - The authenticated user (must be a role admin)
    ///
    /// # Returns
    ///
    /// * `Result<impl IntoResponse, ChaosError>` - Success message or error
    pub async fn delete(
        mut transaction: DBTransaction<'_>,
        Path(id): Path<i64>,
        _admin: RoleAdmin,
    ) -> Result<impl IntoResponse, ChaosError> {
        Role::delete(id, &mut transaction.tx).await?;

        transaction.tx.commit().await?;
        Ok(AppMessage::OkMessage("Successfully deleted role"))
    }

    /// Updates a role.
    ///
    /// This handler allows role admins to update role details.
    ///
    /// # Arguments
    ///
    /// * `state` - The application state
    /// * `id` - The ID of the role to update
    /// * `_admin` - The authenticated user (must be a role admin)
    /// * `data` - The new role details
    ///
    /// # Returns
    ///
    /// * `Result<impl IntoResponse, ChaosError>` - Success message or error
    pub async fn update(
        mut transaction: DBTransaction<'_>,
        Path(id): Path<i64>,
        _admin: RoleAdmin,
        Json(data): Json<RoleUpdate>,
    ) -> Result<impl IntoResponse, ChaosError> {
        Role::update(id, data, &mut transaction.tx).await?;

        transaction.tx.commit().await?;
        Ok(AppMessage::OkMessage("Successfully updated role"))
    }

    /// Retrieves all applications for a specific role.
    ///
    /// This handler allows role admins to view all applications for a role.
    ///
    /// # Arguments
    ///
    /// * `id` - The ID of the role
    /// * `_admin` - The authenticated user (must be a role admin)
    /// * `transaction` - Database transaction
    ///
    /// # Returns
    ///
    /// * `Result<impl IntoResponse, ChaosError>` - List of applications or error
    pub async fn get_applications(
        Path(id): Path<i64>,
        admin: RoleAdmin,
        mut transaction: DBTransaction<'_>,
    ) -> Result<impl IntoResponse, ChaosError> {
        let applications =
            Application::get_from_role_id(id, admin.user_id, &mut transaction.tx).await?;
        transaction.tx.commit().await?;
        Ok((StatusCode::OK, Json(applications)))
    }
}

#[cfg(test)]
mod tests {
    // =========================================================================
    // TEST PLAN – HTTP integration (handler + extractors + auth + DB)
    // =========================================================================
    //
    // Handlers driven through the real Router via oneshot against a #[sqlx::test] DB:
    //   · GET    /api/v1/role/:role_id  -> get     (AuthUser)
    //   · DELETE /api/v1/role/:role_id  -> delete  (RoleAdmin = org 'Admin')
    //
    //  ID    Scenario                       Expected               Test
    //  EP01  GET, no auth cookie            401                    get_requires_authentication
    //  EP02  GET as authed user             200 + role details     get_returns_role
    //  EP03  DELETE as org admin            200 + role removed     admin_can_delete_role
    //  EP04  DELETE as non-admin            403 + role kept        non_admin_cannot_delete_role
    //
    // KNOWN GAPS: update uses RoleUpdate::validate (env-driven) + RoleAdmin; the
    // model layer already covers validate(), so only get/delete wiring is driven here.
    // =========================================================================

    use super::*;
    use crate::test_support::*;
    use axum::http::StatusCode;
    use axum::routing::get;
    use axum::Router;
    use sqlx::PgPool;
    use tower::ServiceExt;

    /// user 1 (plain) owns nothing; user 2 is an Admin of org 1. role 1 lives in
    /// campaign 1 of org 1.
    async fn seed(pool: &PgPool) {
        seed_user(pool, 1, "user@test.com").await;
        seed_user(pool, 2, "admin@test.com").await;
        seed_org(pool, 1, "org").await;
        seed_org_member(pool, 1, 2, "Admin").await;
        seed_campaign(pool, 1, 1, true).await;
        seed_role(pool, 1, 1).await;
    }

    fn router(pool: PgPool) -> Router {
        Router::new()
            .route(
                "/api/v1/role/:role_id",
                get(RoleHandler::get).delete(RoleHandler::delete),
            )
            .with_state(test_state(pool))
    }

    async fn role_count(pool: &PgPool) -> i64 {
        sqlx::query_scalar("SELECT COUNT(*) FROM campaign_roles WHERE id = 1")
            .fetch_one(pool)
            .await
            .unwrap()
    }

    /// White-box: the AuthUser extractor rejects an anonymous GET with 401.
    #[sqlx::test(migrations = "../migrations")]
    async fn get_requires_authentication(pool: PgPool) {
        seed(&pool).await;

        let response = router(pool.clone())
            .oneshot(request("GET", "/api/v1/role/1", None, None))
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
    }

    /// White-box: any authenticated user can read a role's details.
    #[sqlx::test(migrations = "../migrations")]
    async fn get_returns_role(pool: PgPool) {
        seed(&pool).await;

        let response = router(pool.clone())
            .oneshot(request("GET", "/api/v1/role/1", Some(1), None))
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
        let json = body_json(response).await;
        assert_eq!(json["name"], serde_json::json!("Role"));
    }

    /// White-box: an org admin passes the RoleAdmin guard and the role is deleted.
    #[sqlx::test(migrations = "../migrations")]
    async fn admin_can_delete_role(pool: PgPool) {
        seed(&pool).await;

        let response = router(pool.clone())
            .oneshot(request("DELETE", "/api/v1/role/1", Some(2), None))
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
        assert_eq!(role_count(&pool).await, 0, "the role should be deleted");
    }

    /// White-box: a non-admin is stopped by the RoleAdmin guard and the role stays.
    #[sqlx::test(migrations = "../migrations")]
    async fn non_admin_cannot_delete_role(pool: PgPool) {
        seed(&pool).await;

        let response = router(pool.clone())
            .oneshot(request("DELETE", "/api/v1/role/1", Some(1), None))
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::FORBIDDEN);
        assert_eq!(role_count(&pool).await, 1, "the role must not be deleted");
    }
}
