//! Role status handler for the Chaos application.
//!
//! This module provides HTTP request handlers for CRUD operations on per-campaign-role statuses.

use crate::models::app::AppMessage;
use crate::models::auth::{AuthUser, CampaignOrgMember};
use crate::models::error::ChaosError;
use crate::models::role_status::{RoleStatus, UpdateRoleStatus};
use crate::models::transaction::DBTransaction;
use axum::extract::{Json, Path};
use axum::response::IntoResponse;

/// Handler for per-campaign-role status related HTTP requests.
pub struct RoleStatusHandler;

impl RoleStatusHandler {
    /// Set the per-campaign-role status for a given application.
    ///
    /// # Arguments
    /// * `application_id` - ID of the application whose status is being set.
    /// * `campaign_role_id` - ID of the campaign role whose per-role status is being set.
    /// * `_admin` - Authenticated user allowed to set the application's per-role status.
    /// * `transaction` - Database transaction wrapper.
    /// * `data` - Update role payload.
    ///
    /// # Returns
    /// A success message.
    pub async fn update_role_status(
        Path((application_id, campaign_role_id)): Path<(i64, i64)>,
        // TODO: Replace the AuthUser extractor with something that enforces the desired permissions.
        _admin: AuthUser,
        mut transaction: DBTransaction<'_>,
        Json(data): Json<UpdateRoleStatus>,
    ) -> Result<impl IntoResponse, ChaosError> {
        RoleStatus::update_status(
            application_id,
            campaign_role_id,
            data.status,
            &mut transaction.tx,
        )
        .await?;

        transaction.tx.commit().await?;

        Ok(AppMessage::OkMessage(
            "Successfully set per-campaign-role status.",
        ))
    }

    /// Get all per-campaign-role statuses for an application.
    ///
    /// # Arguments
    /// * `application_id` - ID of the application to fetch the per-campaign-role statuses for.
    /// * `_admin` - Authenticated user allowed to view the application's per-role statuses.
    /// * `transaction` - Database transaction wrapper.
    ///
    /// # Returns
    /// The per-campaign-role statuses for the application.
    pub async fn get_role_statuses_for_application(
        Path(application_id): Path<i64>,
        // TODO: Replace the AuthUser extractor with something that enforces the desired permissions.
        _admin: AuthUser,
        mut transaction: DBTransaction<'_>,
    ) -> Result<impl IntoResponse, ChaosError> {
        let statuses =
            RoleStatus::get_all_for_application(application_id, &mut transaction.tx).await?;

        transaction.tx.commit().await?;

        Ok(Json(statuses))
    }

    /// Get all per-campaign-role statuses for a campaign role.
    ///
    /// # Arguments
    /// * `campaign_id` - ID of the campaign to fetch the per-campaign-role statuses for.
    /// * `campaign_role_id` - ID of the campaign role to fetch the per-role statuses for.
    /// * `_admin` - Authenticated user allowed to view the campaign role's statuses.
    /// * `transaction` - Database transaction wrapper.
    ///
    /// # Returns
    /// The per-role statuses for the campaign role.
    pub async fn get_role_statuses_for_campaign_role(
        Path((campaign_id, campaign_role_id)): Path<(i64, i64)>,
        // TODO: Replace the CampaignOrgMember extractor with something that enforces the desired permissions.
        _admin: CampaignOrgMember,
        mut transaction: DBTransaction<'_>,
    ) -> Result<impl IntoResponse, ChaosError> {
        let statuses =
            RoleStatus::get_all_for_campaign_role(campaign_role_id, &mut transaction.tx).await?;

        transaction.tx.commit().await?;

        Ok(Json(statuses))
    }

    /// Get all per-campaign-role statuses for a campaign.
    ///
    /// # Arguments
    /// * `campaign_id` - ID of the campaign to fetch the per-campaign-role statuses for.
    /// * `_admin` - Authenticated user allowed to view the campaign's per-role statuses.
    /// * `transaction` - Database transaction wrapper.
    ///
    /// # Returns
    /// The per-role statuses for the campaign.
    pub async fn get_role_statuses_for_campaign(
        Path(campaign_id): Path<i64>,
        // TODO: Replace the CampaignOrgMember extractor with something that enforces the desired permissions.
        _admin: CampaignOrgMember,
        mut transaction: DBTransaction<'_>,
    ) -> Result<impl IntoResponse, ChaosError> {
        let statuses = RoleStatus::get_all_for_campaign(campaign_id, &mut transaction.tx).await?;

        transaction.tx.commit().await?;

        Ok(Json(statuses))
    }
}

#[cfg(test)]
mod tests {
    // =========================================================================
    // TEST PLAN – HTTP integration (handler + extractors + auth + DB)
    // =========================================================================
    //
    // Handlers driven through the real Router via oneshot against a #[sqlx::test] DB:
    //   · PUT /api/v1/application/:application_id/rolestatus/:campaign_role_id
    //   · GET /api/v1/application/:application_id/rolestatus
    // Both currently guard only with AuthUser (see the handler TODOs).
    //
    //  ID    Scenario                       Expected                          Test
    //  EP01  PUT, no auth cookie            401, status unchanged             update_requires_authentication
    //  EP02  PUT as authed user             200, role_status = new value      update_sets_role_status
    //  EP03  GET as authed user             200, statuses listed              get_returns_statuses
    //
    // KNOWN GAPS: the two campaign-scoped GETs use CampaignOrgMember and, in the
    // router, are registered under paths with a stray trailing backtick; neither
    // is driven here.
    // =========================================================================

    use super::*;
    use crate::test_support::*;
    use axum::http::StatusCode;
    use axum::routing::{get, put};
    use axum::Router;
    use sqlx::PgPool;
    use tower::ServiceExt;

    /// Owned application 1 with one application_roles row (role 1, default Pending).
    async fn seed(pool: &PgPool) {
        seed_owned_application(pool).await;
        sqlx::query(
            "INSERT INTO application_roles (application_id, campaign_role_id, preference)
             VALUES (1, 1, 1)",
        )
        .execute(pool)
        .await
        .unwrap();
    }

    fn router(pool: PgPool) -> Router {
        Router::new()
            .route(
                "/api/v1/application/:application_id/rolestatus/:campaign_role_id",
                put(RoleStatusHandler::update_role_status),
            )
            .route(
                "/api/v1/application/:application_id/rolestatus",
                get(RoleStatusHandler::get_role_statuses_for_application),
            )
            .with_state(test_state(pool))
    }

    async fn stored_status(pool: &PgPool) -> String {
        sqlx::query_scalar(
            "SELECT role_status::text FROM application_roles
             WHERE application_id = 1 AND campaign_role_id = 1",
        )
        .fetch_one(pool)
        .await
        .unwrap()
    }

    /// White-box: an anonymous PUT is rejected and the status stays Pending.
    #[sqlx::test(migrations = "../migrations")]
    async fn update_requires_authentication(pool: PgPool) {
        seed(&pool).await;

        let response = router(pool.clone())
            .oneshot(request(
                "PUT",
                "/api/v1/application/1/rolestatus/1",
                None,
                Some(serde_json::json!({ "status": "Successful" })),
            ))
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
        assert_eq!(stored_status(&pool).await, "Pending");
    }

    /// White-box: an authed PUT writes the new per-role status.
    #[sqlx::test(migrations = "../migrations")]
    async fn update_sets_role_status(pool: PgPool) {
        seed(&pool).await;

        let response = router(pool.clone())
            .oneshot(request(
                "PUT",
                "/api/v1/application/1/rolestatus/1",
                Some(1),
                Some(serde_json::json!({ "status": "Successful" })),
            ))
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
        assert_eq!(stored_status(&pool).await, "Successful");
    }

    /// White-box: the per-application GET returns the seeded role status.
    #[sqlx::test(migrations = "../migrations")]
    async fn get_returns_statuses(pool: PgPool) {
        seed(&pool).await;

        let response = router(pool.clone())
            .oneshot(request(
                "GET",
                "/api/v1/application/1/rolestatus",
                Some(1),
                None,
            ))
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
        let json = body_json(response).await;
        let statuses = json.as_array().expect("statuses should be an array");
        assert_eq!(statuses.len(), 1);
        assert_eq!(statuses[0]["status"], serde_json::json!("Pending"));
    }
}
