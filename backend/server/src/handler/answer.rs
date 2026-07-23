//! Answer handler for the Chaos application.
//!
//! This module provides HTTP request handlers for managing application answers, including:
//! - Creating and retrieving answers
//! - Updating and deleting answers
//! - Managing role-specific answers

use crate::models::answer::{Answer, NewAnswer};
use crate::models::app::{AppMessage, AppState, IdMessage};
use crate::models::application::{OpenApplicationByAnswerId, OpenApplicationByApplicationId};
use crate::models::auth::{AnswerOwner, ApplicationOwner, ApplicationOwnerOrReviewer};
use crate::models::error::ChaosError;
use crate::models::transaction::DBTransaction;
use axum::extract::{Json, Path, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;

/// Handler for answer-related HTTP requests.
pub struct AnswerHandler;

impl AnswerHandler {
    /// Creates a new answer for an application.
    ///
    /// This handler allows application owners to create answers for their application.
    /// The application must be open and not already submitted.
    ///
    /// # Arguments
    ///
    /// * `state` - The application state
    /// * `application_id` - The ID of the application
    /// * `_user` - The authenticated user (must be the application owner)
    /// * `_` - Ensures the application is open
    /// * `transaction` - Database transaction
    /// * `data` - The answer details
    ///
    /// # Returns
    ///
    /// * `Result<impl IntoResponse, ChaosError>` - Created answer ID or error
    pub async fn create(
        State(mut state): State<AppState>,
        Path(application_id): Path<i64>,
        _user: ApplicationOwner,
        _: OpenApplicationByApplicationId,
        mut transaction: DBTransaction<'_>,
        Json(data): Json<NewAnswer>,
    ) -> Result<impl IntoResponse, ChaosError> {
        // TODO: Check whether the question is contained in the campaign being applied to
        let id = Answer::create(
            application_id,
            data.question_id,
            data.data,
            &mut state.snowflake_generator,
            &mut transaction.tx,
        )
        .await?;

        transaction.tx.commit().await?;

        Ok((StatusCode::OK, Json(IdMessage { id })))
    }

    /// Retrieves all common answers for an application.
    ///
    /// This handler allows application owners to view all common answers.
    ///
    /// # Arguments
    ///
    /// * `application_id` - The ID of the application
    /// * `_owner` - The authenticated user (must be the application owner)
    /// * `transaction` - Database transaction
    ///
    /// # Returns
    ///
    /// * `Result<impl IntoResponse, ChaosError>` - List of answers or error
    pub async fn get_all_common_by_application(
        Path(application_id): Path<i64>,
        _owner: ApplicationOwnerOrReviewer,
        mut transaction: DBTransaction<'_>,
    ) -> Result<impl IntoResponse, ChaosError> {
        let answers =
            Answer::get_all_common_by_application(application_id, &mut transaction.tx).await?;

        transaction.tx.commit().await?;

        Ok(Json(answers))
    }

    /// Retrieves all answers for a specific role in an application.
    ///
    /// This handler allows application owners to view role-specific answers.
    ///
    /// # Arguments
    ///
    /// * `application_id` - The ID of the application
    /// * `role_id` - The ID of the role
    /// * `_owner` - The authenticated user (must be the application owner)
    /// * `transaction` - Database transaction
    ///
    /// # Returns
    ///
    /// * `Result<impl IntoResponse, ChaosError>` - List of answers or error
    pub async fn get_all_by_application_and_role(
        Path((application_id, role_id)): Path<(i64, i64)>,
        _owner: ApplicationOwnerOrReviewer,
        mut transaction: DBTransaction<'_>,
    ) -> Result<impl IntoResponse, ChaosError> {
        let answers =
            Answer::get_all_by_application_and_role(application_id, role_id, &mut transaction.tx)
                .await?;

        transaction.tx.commit().await?;

        Ok(Json(answers))
    }

    /// Updates an existing answer.
    ///
    /// This handler allows answer owners to update their answers.
    /// The application must be open and not already submitted.
    ///
    /// # Arguments
    ///
    /// * `answer_id` - The ID of the answer to update
    /// * `_owner` - The authenticated user (must be the answer owner)
    /// * `_` - Ensures the application is open
    /// * `transaction` - Database transaction
    /// * `data` - The new answer details
    ///
    /// # Returns
    ///
    /// * `Result<impl IntoResponse, ChaosError>` - Success message or error
    pub async fn update(
        Path(answer_id): Path<i64>,
        _owner: AnswerOwner,
        _: OpenApplicationByAnswerId, // Troublesome throws BadRequest
        mut transaction: DBTransaction<'_>,
        Json(new_answer): Json<NewAnswer>,
    ) -> Result<impl IntoResponse, ChaosError> {
        Answer::update(answer_id, new_answer.data, &mut transaction.tx).await?;

        transaction.tx.commit().await?;

        Ok(AppMessage::OkMessage("Successfully updated answer"))
    }

    /// Deletes an answer.
    ///
    /// This handler allows answer owners to delete their answers.
    /// The application must be open and not already submitted.
    ///
    /// # Arguments
    ///
    /// * `answer_id` - The ID of the answer to delete
    /// * `_owner` - The authenticated user (must be the answer owner)
    /// * `_` - Ensures the application is open
    /// * `transaction` - Database transaction
    ///
    /// # Returns
    ///
    /// * `Result<impl IntoResponse, ChaosError>` - Success message or error
    pub async fn delete(
        Path(answer_id): Path<i64>,
        _owner: AnswerOwner,
        _: OpenApplicationByAnswerId,
        mut transaction: DBTransaction<'_>,
    ) -> Result<impl IntoResponse, ChaosError> {
        Answer::delete(answer_id, &mut transaction.tx).await?;

        transaction.tx.commit().await?;

        Ok(AppMessage::OkMessage("Successfully deleted answer"))
    }
}

#[cfg(test)]
mod tests {
    // =========================================================================
    // TEST PLAN – HTTP integration (handler + extractors + auth + DB)
    // =========================================================================
    //
    // Handlers under test (driven through the real axum Router via oneshot)
    //   · POST /api/v1/application/:application_id/answer          -> AnswerHandler::create
    //   · GET  /api/v1/application/:application_id/answers/common  -> AnswerHandler::get_all_common_by_application
    //
    // Handlers carry no branching of their own, so the contract under test is the
    // *wiring*: the auth cookie extractor, the ownership/open-application guards,
    // JSON (de)serialisation, the model call, the commit, and the status mapping.
    // Everything runs against a real Postgres via #[sqlx::test]; requests are made
    // with a signed JWT cookie exactly as a browser would send one.
    //
    // ── EQUIVALENCE PARTITIONING ──────────────────────────────────────────────
    //
    // Auth / ownership class of the caller
    //
    //  ID    Caller                         Expected status   Test
    //  EP01  no auth_token cookie           401 UNAUTHORIZED  create_requires_authentication
    //  EP02  authed but not the owner       403 FORBIDDEN     create_rejected_for_non_owner
    //  EP03  authed owner, valid body       200 OK + id       create_persists_answer
    //
    // Round-trip through two handlers
    //
    //  ID    Flow                                   Expected                     Test
    //  EP04  POST create then GET common            GET returns the new answer   created_answer_is_returned_by_common_get
    //
    // ── BOUNDARY VALUE ANALYSIS ───────────────────────────────────────────────
    //
    // Extractor ordering – the auth/ownership guards must run and short-circuit
    // BEFORE the model layer is touched. The boundary is "guard rejects vs body
    // reaches the model": EP01/EP02 assert nothing is written; EP03 asserts a row
    // appears. That pair brackets the guard boundary.
    //
    // ── KNOWN GAPS ────────────────────────────────────────────────────────────
    //
    //  · update/delete (AnswerOwner + OpenApplicationByAnswerId) and
    //    get_all_by_application_and_role are not driven here; they share the same
    //    wiring shape as the two covered handlers. The test AppState stubs S3,
    //    OAuth and SMTP (never exercised by answer handlers), so any handler that
    //    actually calls storage/email is out of scope for this harness.
    //
    //  · The harness helpers (test_state/auth_cookie/request/body_json/seed_*)
    //    live in crate::test_support and are shared across all handler test
    //    modules; only the route wiring and body shapes are per-file here.
    // =========================================================================

    use super::*;
    use crate::test_support::*;
    use axum::http::StatusCode;
    use axum::routing::{get, post};
    use axum::Router;
    use sqlx::PgPool;
    use tower::ServiceExt;

    // ── harness ──────────────────────────────────────────────────────────────

    /// Mounts only the answer routes exercised by these tests, on the shared
    /// test AppState.
    fn router(pool: PgPool) -> Router {
        Router::new()
            .route(
                "/api/v1/application/:application_id/answer",
                post(AnswerHandler::create),
            )
            .route(
                "/api/v1/application/:application_id/answers/common",
                get(AnswerHandler::get_all_common_by_application),
            )
            .with_state(test_state(pool))
    }

    /// Shared owned-application graph plus a common ShortAnswer question q100.
    async fn seed(pool: &PgPool) {
        seed_owned_application(pool).await;
        seed_question(pool, 100, 1, true, "ShortAnswer").await;
    }

    /// NewAnswer JSON: a common ShortAnswer to question 100.
    fn short_answer() -> serde_json::Value {
        serde_json::json!({
            "question_id": "100",
            "answer_type": "ShortAnswer",
            "answer_data": "hello"
        })
    }

    async fn answer_count(pool: &PgPool) -> i64 {
        sqlx::query_scalar("SELECT COUNT(*) FROM answers")
            .fetch_one(pool)
            .await
            .unwrap()
    }

    // ── AnswerHandler::create ──────────────────────────────────────────────────

    /// White-box: a request with no auth_token cookie is stopped at the extractor
    /// (NotLoggedIn -> 401) before any DB write.
    #[sqlx::test(migrations = "../migrations")]
    async fn create_requires_authentication(pool: PgPool) {
        seed(&pool).await;

        let response = router(pool.clone())
            .oneshot(request(
                "POST",
                "/api/v1/application/1/answer",
                None,
                Some(short_answer()),
            ))
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
        assert_eq!(answer_count(&pool).await, 0, "unauthenticated create must not write");
    }

    /// White-box: an authenticated non-owner is rejected by the ApplicationOwner
    /// guard (Unauthorized -> 403) before the model runs.
    #[sqlx::test(migrations = "../migrations")]
    async fn create_rejected_for_non_owner(pool: PgPool) {
        seed(&pool).await;

        let response = router(pool.clone())
            .oneshot(request(
                "POST",
                "/api/v1/application/1/answer",
                Some(999),
                Some(short_answer()),
            ))
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::FORBIDDEN);
        assert_eq!(answer_count(&pool).await, 0, "non-owner create must not write");
    }

    /// White-box: the owner's valid create returns 200 with the new id and lands
    /// a row (extractors pass, body parses, model runs, transaction commits).
    #[sqlx::test(migrations = "../migrations")]
    async fn create_persists_answer(pool: PgPool) {
        seed(&pool).await;

        let response = router(pool.clone())
            .oneshot(request(
                "POST",
                "/api/v1/application/1/answer",
                Some(1),
                Some(short_answer()),
            ))
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
        let json = body_json(response).await;
        assert!(
            json["id"].as_str().is_some(),
            "response should carry the new id as a string, got {json}"
        );

        let text: String = sqlx::query_scalar(
            "SELECT saa.text FROM short_answer_answers saa
             JOIN answers a ON a.id = saa.answer_id
             WHERE a.application_id = 1 AND a.question_id = 100",
        )
        .fetch_one(&pool)
        .await
        .unwrap();
        assert_eq!(text, "hello");
    }

    // ── create -> get_all_common round-trip ────────────────────────────────────

    /// White-box: an answer created over HTTP is returned by the common-answers
    /// GET, proving both handlers share the same DB and serde contract.
    #[sqlx::test(migrations = "../migrations")]
    async fn created_answer_is_returned_by_common_get(pool: PgPool) {
        seed(&pool).await;

        router(pool.clone())
            .oneshot(request(
                "POST",
                "/api/v1/application/1/answer",
                Some(1),
                Some(short_answer()),
            ))
            .await
            .unwrap();

        let response = router(pool.clone())
            .oneshot(request(
                "GET",
                "/api/v1/application/1/answers/common",
                Some(1),
                None,
            ))
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
        let json = body_json(response).await;
        let answers = json.as_array().expect("common answers should be an array");
        assert_eq!(answers.len(), 1, "the one common answer should come back");
        assert_eq!(answers[0]["question_id"], serde_json::json!("100"));
        assert_eq!(answers[0]["answer_data"], serde_json::json!("hello"));
    }
}
