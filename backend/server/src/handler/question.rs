//! Question handler for the Chaos application.
//!
//! This module provides HTTP request handlers for managing questions, including:
//! - Creating and retrieving questions
//! - Updating and deleting questions
//! - Managing role-specific and common questions

use crate::models::app::{AppMessage, AppState, IdMessage};
use crate::models::auth::{AuthUser, CampaignAdmin, QuestionAdmin};
use crate::models::error::ChaosError;
use crate::models::question::{NewQuestion, Question};
use crate::models::transaction::DBTransaction;
use axum::extract::{Json, Path, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;

/// Handler for question-related HTTP requests.
pub struct QuestionHandler;

impl QuestionHandler {
    /// Creates a new question for a campaign.
    ///
    /// This handler allows campaign admins to create questions.
    ///
    /// # Arguments
    ///
    /// * `state` - The application state
    /// * `campaign_id` - The ID of the campaign
    /// * `_admin` - The authenticated user (must be a campaign admin)
    /// * `transaction` - Database transaction
    /// * `data` - The new question details
    ///
    /// # Returns
    ///
    /// * `Result<impl IntoResponse, ChaosError>` - Question ID or error
    pub async fn create(
        State(mut state): State<AppState>,
        Path(campaign_id): Path<i64>,
        _admin: CampaignAdmin,
        mut transaction: DBTransaction<'_>,
        Json(data): Json<NewQuestion>,
    ) -> Result<impl IntoResponse, ChaosError> {
        let id = Question::create(
            campaign_id,
            data.title,
            data.description,
            data.common,
            Some(data.roles),
            data.required,
            data.question_data,
            &mut state.snowflake_generator,
            &mut transaction.tx,
        )
        .await?;

        transaction.tx.commit().await?;

        Ok((StatusCode::OK, Json(IdMessage { id })))
    }

    /// Retrieves all questions for a specific role in a campaign.
    ///
    /// This handler allows any authenticated user to view role-specific questions.
    ///
    /// # Arguments
    ///
    /// * `campaign_id` - The ID of the campaign
    /// * `role_id` - The ID of the role
    /// * `_user` - The authenticated user
    /// * `transaction` - Database transaction
    ///
    /// # Returns
    ///
    /// * `Result<impl IntoResponse, ChaosError>` - List of questions or error
    pub async fn get_all_by_campaign_and_role(
        Path((campaign_id, role_id)): Path<(i64, i64)>,
        _user: AuthUser,
        mut transaction: DBTransaction<'_>,
    ) -> Result<impl IntoResponse, ChaosError> {
        let questions =
            Question::get_all_by_campaign_and_role(campaign_id, role_id, &mut transaction.tx)
                .await?;

        transaction.tx.commit().await?;

        Ok((StatusCode::OK, Json(questions)))
    }

    /// Retrieves all common questions for a campaign.
    ///
    /// This handler allows any authenticated user to view common questions.
    ///
    /// # Arguments
    ///
    /// * `campaign_id` - The ID of the campaign
    /// * `_user` - The authenticated user
    /// * `transaction` - Database transaction
    ///
    /// # Returns
    ///
    /// * `Result<impl IntoResponse, ChaosError>` - List of questions or error
    pub async fn get_all_common_by_campaign(
        Path(campaign_id): Path<i64>,
        _user: AuthUser,
        mut transaction: DBTransaction<'_>,
    ) -> Result<impl IntoResponse, ChaosError> {
        let questions =
            Question::get_all_common_by_campaign(campaign_id, &mut transaction.tx).await?;

        transaction.tx.commit().await?;

        Ok((StatusCode::OK, Json(questions)))
    }

    /// Updates a question.
    ///
    /// This handler allows question admins to update question details.
    ///
    /// # Arguments
    ///
    /// * `state` - The application state
    /// * `campaign_id` - The ID of the campaign
    /// * `question_id` - The ID of the question to update
    /// * `_admin` - The authenticated user (must be a question admin)
    /// * `transaction` - Database transaction
    /// * `data` - The new question details
    ///
    /// # Returns
    ///
    /// * `Result<impl IntoResponse, ChaosError>` - Success message or error
    pub async fn update(
        mut transaction: DBTransaction<'_>,
        State(mut state): State<AppState>,
        Path((_campaign_id, question_id)): Path<(i64, i64)>,
        _admin: QuestionAdmin,
        Json(data): Json<NewQuestion>,
    ) -> Result<impl IntoResponse, ChaosError> {
        // Validate question_data before updating
        data.question_data.validate()
            .map_err(|_| {
                ChaosError::BadRequestWithMessage(
                    "Question validation failed: options array is empty for question types that require options".to_string()
                )
            })?;

        Question::update(
            question_id,
            data.title,
            data.description,
            data.common,
            data.roles,
            data.required,
            data.short_answer_word_limit,
            data.question_data,
            &mut transaction.tx,
            &mut state.snowflake_generator,
        )
        .await?;

        transaction.tx.commit().await?;

        Ok(AppMessage::OkMessage("Successfully updated question"))
    }

    /// Deletes a question.
    ///
    /// This handler allows question admins to delete questions.
    ///
    /// # Arguments
    ///
    /// * `campaign_id` - The ID of the campaign
    /// * `question_id` - The ID of the question to delete
    /// * `_admin` - The authenticated user (must be a question admin)
    /// * `transaction` - Database transaction
    ///
    /// # Returns
    ///
    /// * `Result<impl IntoResponse, ChaosError>` - Success message or error
    pub async fn delete(
        Path((_campaign_id, question_id)): Path<(i64, i64)>,
        _admin: QuestionAdmin,
        mut transaction: DBTransaction<'_>,
    ) -> Result<impl IntoResponse, ChaosError> {
        Question::delete(question_id, &mut transaction.tx).await?;

        transaction.tx.commit().await?;

        Ok(AppMessage::OkMessage("Successfully deleted question"))
    }
}

#[cfg(test)]
mod tests {
    // =========================================================================
    // TEST PLAN – HTTP integration (handler + extractors + auth + DB)
    // =========================================================================
    //
    // Handlers driven through the real Router via oneshot against a #[sqlx::test] DB:
    //   · POST /api/v1/campaign/:campaign_id/question          -> create (CampaignAdmin)
    //   · GET  /api/v1/campaign/:campaign_id/questions/common  -> get_all_common (AuthUser)
    //
    //  ID    Scenario                       Expected               Test
    //  EP01  create, no auth cookie         401, no row            create_requires_authentication
    //  EP02  create as non-admin            403, no row            create_rejected_for_non_admin
    //  EP03  create as campaign admin       200 + question row     admin_creates_question
    //  EP04  create then GET common         question returned      created_question_is_listed
    //
    // KNOWN GAPS: update/delete use QuestionAdmin and share the wiring; not driven
    // here. update's own validate() path is covered at the model layer.
    // =========================================================================

    use super::*;
    use crate::test_support::*;
    use axum::http::StatusCode;
    use axum::routing::{get, post};
    use axum::Router;
    use sqlx::PgPool;
    use tower::ServiceExt;

    /// user 1 (plain), user 2 (org Admin), org 1 → campaign 1.
    async fn seed(pool: &PgPool) {
        seed_user(pool, 1, "user@test.com").await;
        seed_user(pool, 2, "admin@test.com").await;
        seed_org(pool, 1, "org").await;
        seed_org_member(pool, 1, 2, "Admin").await;
        seed_campaign(pool, 1, 1, true).await;
    }

    fn router(pool: PgPool) -> Router {
        Router::new()
            .route(
                "/api/v1/campaign/:campaign_id/question",
                post(QuestionHandler::create),
            )
            .route(
                "/api/v1/campaign/:campaign_id/questions/common",
                get(QuestionHandler::get_all_common_by_campaign),
            )
            .with_state(test_state(pool))
    }

    /// A common ShortAnswer question payload (no options required).
    fn question_body() -> serde_json::Value {
        serde_json::json!({
            "title": "Why apply?",
            "description": null,
            "common": true,
            "roles": null,
            "required": true,
            "question_type": "ShortAnswer"
        })
    }

    async fn question_count(pool: &PgPool) -> i64 {
        sqlx::query_scalar("SELECT COUNT(*) FROM questions")
            .fetch_one(pool)
            .await
            .unwrap()
    }

    /// White-box: anonymous create is stopped at the CampaignAdmin extractor.
    #[sqlx::test(migrations = "../migrations")]
    async fn create_requires_authentication(pool: PgPool) {
        seed(&pool).await;

        let response = router(pool.clone())
            .oneshot(request(
                "POST",
                "/api/v1/campaign/1/question",
                None,
                Some(question_body()),
            ))
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
        assert_eq!(question_count(&pool).await, 0);
    }

    /// White-box: a non-admin is rejected by the CampaignAdmin guard.
    #[sqlx::test(migrations = "../migrations")]
    async fn create_rejected_for_non_admin(pool: PgPool) {
        seed(&pool).await;

        let response = router(pool.clone())
            .oneshot(request(
                "POST",
                "/api/v1/campaign/1/question",
                Some(1),
                Some(question_body()),
            ))
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::FORBIDDEN);
        assert_eq!(question_count(&pool).await, 0);
    }

    /// White-box: a campaign admin's create returns 200 and lands a question.
    #[sqlx::test(migrations = "../migrations")]
    async fn admin_creates_question(pool: PgPool) {
        seed(&pool).await;

        let response = router(pool.clone())
            .oneshot(request(
                "POST",
                "/api/v1/campaign/1/question",
                Some(2),
                Some(question_body()),
            ))
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
        let json = body_json(response).await;
        assert!(json["id"].as_str().is_some(), "expected id, got {json}");
        assert_eq!(question_count(&pool).await, 1);
    }

    /// White-box: a created common question is returned by the common GET.
    #[sqlx::test(migrations = "../migrations")]
    async fn created_question_is_listed(pool: PgPool) {
        seed(&pool).await;

        router(pool.clone())
            .oneshot(request(
                "POST",
                "/api/v1/campaign/1/question",
                Some(2),
                Some(question_body()),
            ))
            .await
            .unwrap();

        let response = router(pool.clone())
            .oneshot(request(
                "GET",
                "/api/v1/campaign/1/questions/common",
                Some(1),
                None,
            ))
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
        let json = body_json(response).await;
        let questions = json.as_array().expect("questions should be an array");
        assert_eq!(questions.len(), 1);
        assert_eq!(questions[0]["title"], serde_json::json!("Why apply?"));
    }
}
