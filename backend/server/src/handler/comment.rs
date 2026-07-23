//! Comment handler for the Chaos application.
//!
//! This module provides HTTP request handlers for CRUD operations on application comments.

use crate::models::app::{AppMessage, AppState};
use crate::models::auth::{
    ApplicationReviewerGivenApplicationId, CommentAuthorGivenApplicationAndCommentId,
};
use crate::models::comment::{Comment, NewComment, UpdateComment};
use crate::models::error::ChaosError;
use crate::models::transaction::DBTransaction;
use axum::extract::{Json, Path, State};
use axum::response::IntoResponse;

/// Handler for comment-related HTTP requests.
pub struct CommentHandler;

impl CommentHandler {
    /// Creates a new comment on an application.
    ///
    /// # Arguments
    /// * `state` - Application state (includes snowflake generator).
    /// * `application_id` - ID of the application being commented on.
    /// * `admin` - Authenticated user allowed to review the application.
    /// * `transaction` - Database transaction wrapper.
    /// * `data` - New comment payload.
    ///
    /// # Returns
    /// Returns the created comment ID.
    pub async fn create_comment(
        State(mut state): State<AppState>,
        Path(application_id): Path<i64>,
        admin: ApplicationReviewerGivenApplicationId,
        mut transaction: DBTransaction<'_>,
        Json(data): Json<NewComment>,
    ) -> Result<impl IntoResponse, ChaosError> {
        let id = Comment::create(
            data.body,
            admin.user_id,
            application_id,
            &mut state.snowflake_generator,
            &mut transaction.tx,
        )
        .await?;

        transaction.tx.commit().await?;

        Ok(AppMessage::OkMessage(id))
    }

    /// Edits an existing comment.
    ///
    /// # Arguments
    /// * `application_id` - ID of the application the comment belongs to.
    /// * `comment_id` - ID of the comment to edit.
    /// * `admin` - Authenticated user allowed to review the application.
    /// * `transaction` - Database transaction wrapper.
    /// * `data` - Updated comment payload.
    ///
    /// # Returns
    /// Returns an OK message on success.
    pub async fn edit_comment(
        Path((application_id, comment_id)): Path<(i64, i64)>,
        admin: CommentAuthorGivenApplicationAndCommentId,
        mut transaction: DBTransaction<'_>,
        Json(data): Json<UpdateComment>,
    ) -> Result<impl IntoResponse, ChaosError> {
        Comment::update(
            comment_id,
            admin.user_id,
            application_id,
            data.body,
            &mut transaction.tx,
        )
        .await?;

        transaction.tx.commit().await?;

        Ok(AppMessage::OkMessage("Successfully updated comment"))
    }

    /// Deletes an existing comment.
    ///
    /// # Arguments
    /// * `application_id` - ID of the application the comment belongs to.
    /// * `comment_id` - ID of the comment to delete.
    /// * `admin` - Authenticated user allowed to review the application.
    /// * `transaction` - Database transaction wrapper.
    ///
    /// # Returns
    /// Returns an OK message on success.
    pub async fn delete_comment(
        Path((application_id, comment_id)): Path<(i64, i64)>,
        admin: CommentAuthorGivenApplicationAndCommentId,
        mut transaction: DBTransaction<'_>,
    ) -> Result<impl IntoResponse, ChaosError> {
        Comment::delete(
            comment_id,
            admin.user_id,
            application_id,
            &mut transaction.tx,
        )
        .await?;

        transaction.tx.commit().await?;

        Ok(AppMessage::OkMessage("Successfully deleted comment"))
    }

    /// Get all comments for an application.
    ///
    /// # Arguments
    /// * `application_id` - ID of the application to fetch the comments for.
    /// * `_admin` - Authenticated user allowed to review the application.
    /// * `transaction` - Database transaction wrapper.
    ///
    /// # Returns
    /// The comments for the application.
    pub async fn get_comments_by_application(
        Path(application_id): Path<i64>,
        _admin: ApplicationReviewerGivenApplicationId,
        mut transaction: DBTransaction<'_>,
    ) -> Result<impl IntoResponse, ChaosError> {
        let comments =
            Comment::get_comments_by_application(application_id, &mut transaction.tx).await?;

        transaction.tx.commit().await?;

        Ok(Json(comments))
    }
}

#[cfg(test)]
mod tests {
    // =========================================================================
    // TEST PLAN – HTTP integration (handler + extractors + auth + DB)
    // =========================================================================
    //
    // Handlers driven through the real Router via oneshot against a #[sqlx::test] DB:
    //   · POST /api/v1/application/:application_id/comment  -> create_comment
    //   · GET  /api/v1/application/:application_id/comment  -> get_comments_by_application
    //
    //  ID    Scenario                       Expected               Test
    //  EP01  create, no auth cookie         401, no row            create_requires_authentication
    //  EP02  create as authed reviewer      200 + comment row      create_persists_comment
    //  EP03  create then GET                comment returned       created_comment_is_listed
    //
    // The reviewer guard (ApplicationReviewerGivenApplicationId) requires the
    // caller to be a member of the application's organisation AND the application
    // to be submitted, so the seed establishes both.
    //
    // KNOWN GAPS: edit/delete use CommentAuthorGivenApplicationAndCommentId (author
    // scoping) and share the same wiring; not driven here.
    // =========================================================================

    use super::*;
    use crate::test_support::*;
    use axum::http::StatusCode;
    use axum::routing::post;
    use axum::Router;
    use sqlx::PgPool;
    use tower::ServiceExt;

    fn router(pool: PgPool) -> Router {
        Router::new()
            .route(
                "/api/v1/application/:application_id/comment",
                post(CommentHandler::create_comment)
                    .get(CommentHandler::get_comments_by_application),
            )
            .with_state(test_state(pool))
    }

    /// Owned application 1, plus user 1 as an org member and the application
    /// marked submitted — the reviewer guard requires both.
    async fn seed(pool: &PgPool) {
        seed_owned_application(pool).await;
        seed_org_member(pool, 1, 1, "User").await;
        sqlx::query("UPDATE applications SET submitted = true WHERE id = 1")
            .execute(pool)
            .await
            .unwrap();
    }

    async fn comment_count(pool: &PgPool) -> i64 {
        sqlx::query_scalar("SELECT COUNT(*) FROM comments")
            .fetch_one(pool)
            .await
            .unwrap()
    }

    /// White-box: no cookie -> 401 before any write.
    #[sqlx::test(migrations = "../migrations")]
    async fn create_requires_authentication(pool: PgPool) {
        seed(&pool).await;

        let response = router(pool.clone())
            .oneshot(request(
                "POST",
                "/api/v1/application/1/comment",
                None,
                Some(serde_json::json!({ "body": "hi" })),
            ))
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
        assert_eq!(comment_count(&pool).await, 0);
    }

    /// White-box: an authed reviewer's comment is created and committed.
    #[sqlx::test(migrations = "../migrations")]
    async fn create_persists_comment(pool: PgPool) {
        seed(&pool).await;

        let response = router(pool.clone())
            .oneshot(request(
                "POST",
                "/api/v1/application/1/comment",
                Some(1),
                Some(serde_json::json!({ "body": "looks good" })),
            ))
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
        let body: String = sqlx::query_scalar("SELECT body FROM comments WHERE application_id = 1")
            .fetch_one(&pool)
            .await
            .unwrap();
        assert_eq!(body, "looks good");
    }

    /// White-box: a created comment is returned by the list endpoint (join to users).
    #[sqlx::test(migrations = "../migrations")]
    async fn created_comment_is_listed(pool: PgPool) {
        seed(&pool).await;

        router(pool.clone())
            .oneshot(request(
                "POST",
                "/api/v1/application/1/comment",
                Some(1),
                Some(serde_json::json!({ "body": "first" })),
            ))
            .await
            .unwrap();

        let response = router(pool.clone())
            .oneshot(request("GET", "/api/v1/application/1/comment", Some(1), None))
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
        let json = body_json(response).await;
        let comments = json.as_array().expect("comments should be an array");
        assert_eq!(comments.len(), 1);
        assert_eq!(comments[0]["body"], serde_json::json!("first"));
    }
}
