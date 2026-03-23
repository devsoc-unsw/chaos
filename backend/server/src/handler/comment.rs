//! Comment handler for the Chaos application.
//!
//! This module provides HTTP request handlers for CRUD operations on application comments.

use crate::models::app::{AppMessage, AppState};
use crate::models::auth::{ApplicationReviewerGivenApplicationId, CommentAuthorGivenApplicationAndCommentId};
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

    // pub async fn get_comments_by_application(
        
    // )
}

