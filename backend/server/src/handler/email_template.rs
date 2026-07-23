//! Email template handler for the Chaos application.
//!
//! This module provides HTTP request handlers for managing email templates, including:
//! - Retrieving template details
//! - Updating templates
//! - Deleting templates

use crate::models::app::{AppMessage, AppState};
use crate::models::auth::EmailTemplateAdmin;
use crate::models::email_template::EmailTemplate;
use crate::models::error::ChaosError;
use crate::models::transaction::DBTransaction;
use axum::extract::{Json, Path, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;

/// Handler for email template-related HTTP requests.
pub struct EmailTemplateHandler;

impl EmailTemplateHandler {
    /// Retrieves the details of a specific email template.
    ///
    /// This handler allows email template admins to view template details.
    ///
    /// # Arguments
    ///
    /// * `transaction` - Database transaction
    /// * `id` - The ID of the template to retrieve
    /// * `_user` - The authenticated user (must be an email template admin)
    ///
    /// # Returns
    ///
    /// * `Result<impl IntoResponse, ChaosError>` - Template details or error
    pub async fn get(
        mut transaction: DBTransaction<'_>,
        Path(id): Path<i64>,
        _user: EmailTemplateAdmin,
    ) -> Result<impl IntoResponse, ChaosError> {
        let email_template = EmailTemplate::get(id, &mut transaction.tx).await?;

        Ok((StatusCode::OK, Json(email_template)))
    }

    /// Updates an email template.
    ///
    /// This handler allows email template admins to update template details.
    ///
    /// # Arguments
    ///
    /// * `_user` - The authenticated user (must be an email template admin)
    /// * `id` - The ID of the template to update
    /// * `state` - The application state
    /// * `request_body` - The new template details
    ///
    /// # Returns
    ///
    /// * `Result<impl IntoResponse, ChaosError>` - Success message or error
    pub async fn update(
        _user: EmailTemplateAdmin,
        Path(id): Path<i64>,
        mut transaction: DBTransaction<'_>,
        Json(request_body): Json<EmailTemplate>,
    ) -> Result<impl IntoResponse, ChaosError> {
        EmailTemplate::update(
            id,
            request_body.name,
            request_body.template_subject,
            request_body.template_body,
            &mut transaction.tx,
        )
        .await?;

        transaction.tx.commit().await?;
        Ok(AppMessage::OkMessage("Successfully updated email template"))
    }

    /// Deletes an email template.
    ///
    /// This handler allows email template admins to delete templates.
    ///
    /// # Arguments
    ///
    /// * `_user` - The authenticated user (must be an email template admin)
    /// * `id` - The ID of the template to delete
    /// * `state` - The application state
    ///
    /// # Returns
    ///
    /// * `Result<impl IntoResponse, ChaosError>` - Success message or error
    pub async fn delete(
        _user: EmailTemplateAdmin,
        Path(id): Path<i64>,
        mut transaction: DBTransaction<'_>,
    ) -> Result<impl IntoResponse, ChaosError> {
        EmailTemplate::delete(id, &mut transaction.tx).await?;

        transaction.tx.commit().await?;
        Ok(AppMessage::OkMessage("Successfully deleted email template"))
    }

    /// Duplicates an email template.
    ///
    /// This handler allows email template admins to duplicate templates.
    ///
    /// # Arguments
    ///
    /// * `_user` - The authenticated user (must be an email template admin)
    /// * `id` - The ID of the template to delete
    /// * `state` - The application state
    ///
    /// # Returns
    ///
    /// * `Result<impl IntoResponse, ChaosError>` - Success message or error
    pub async fn duplicate(
        _user: EmailTemplateAdmin,
        Path(id): Path<i64>,
        State(mut state): State<AppState>,
        mut transaction: DBTransaction<'_>,
    ) -> Result<impl IntoResponse, ChaosError> {
        EmailTemplate::duplicate(id, &mut transaction.tx, &mut state.snowflake_generator).await?;

        transaction.tx.commit().await?;
        Ok(AppMessage::OkMessage(
            "Successfully duplicated email template",
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
    //   · GET   /api/v1/email_template/:template_id  -> get    (EmailTemplateAdmin)
    //   · PATCH /api/v1/email_template/:template_id  -> update (EmailTemplateAdmin)
    //
    // EmailTemplateAdmin = an 'Admin' member of the template's organisation.
    //
    //  ID    Scenario                       Expected               Test
    //  EP01  GET, no auth cookie            401                    get_requires_authentication
    //  EP02  GET as org admin               200 + template         admin_reads_template
    //  EP03  PATCH then GET                 name updated           update_round_trips
    //
    // KNOWN GAPS: delete/duplicate share the EmailTemplateAdmin wiring; duplicate's
    // nanoid-suffixed copy behaviour is a model concern and not driven here.
    // =========================================================================

    use super::*;
    use crate::test_support::*;
    use axum::http::StatusCode;
    use axum::routing::{get, patch};
    use axum::Router;
    use sqlx::PgPool;
    use tower::ServiceExt;

    /// org 1 with an Admin (user 2) and a template (id 1).
    async fn seed(pool: &PgPool) {
        seed_user(pool, 2, "admin@test.com").await;
        seed_org(pool, 1, "org").await;
        seed_org_member(pool, 1, 2, "Admin").await;
        sqlx::query(
            "INSERT INTO email_templates (id, organisation_id, name, template_subject, template_body)
             VALUES (1, 1, 'Original', 'Subject', 'Body')",
        )
        .execute(pool)
        .await
        .unwrap();
    }

    fn router(pool: PgPool) -> Router {
        Router::new()
            .route(
                "/api/v1/email_template/:template_id",
                get(EmailTemplateHandler::get).patch(EmailTemplateHandler::update),
            )
            .with_state(test_state(pool))
    }

    /// White-box: reading a template requires authentication.
    #[sqlx::test(migrations = "../migrations")]
    async fn get_requires_authentication(pool: PgPool) {
        seed(&pool).await;

        let response = router(pool.clone())
            .oneshot(request("GET", "/api/v1/email_template/1", None, None))
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
    }

    /// White-box: an org admin reads the template.
    #[sqlx::test(migrations = "../migrations")]
    async fn admin_reads_template(pool: PgPool) {
        seed(&pool).await;

        let response = router(pool.clone())
            .oneshot(request("GET", "/api/v1/email_template/1", Some(2), None))
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
        let json = body_json(response).await;
        assert_eq!(json["name"], serde_json::json!("Original"));
    }

    /// White-box: an update is persisted and reflected by a subsequent GET.
    #[sqlx::test(migrations = "../migrations")]
    async fn update_round_trips(pool: PgPool) {
        seed(&pool).await;

        let patch_resp = router(pool.clone())
            .oneshot(request(
                "PATCH",
                "/api/v1/email_template/1",
                Some(2),
                Some(serde_json::json!({
                    "id": "1",
                    "organisation_id": "1",
                    "name": "Renamed",
                    "template_subject": "New subject",
                    "template_body": "New body"
                })),
            ))
            .await
            .unwrap();
        assert_eq!(patch_resp.status(), StatusCode::OK);

        let json = body_json(
            router(pool.clone())
                .oneshot(request("GET", "/api/v1/email_template/1", Some(2), None))
                .await
                .unwrap(),
        )
        .await;
        assert_eq!(json["name"], serde_json::json!("Renamed"));
        assert_eq!(json["template_subject"], serde_json::json!("New subject"));
    }
}
