//! Comment handler for the Chaos application.
//!
//! This module provides HTTP request handlers for CRUD operations on application comments.

use crate::models::app::{AppMessage, AppState};
use crate::models::auth::{
    ApplicationReviewerGivenApplicationId, CommentAuthorGivenApplicationAndCommentId,
};
use crate::models::comment_last_read::{CommentLastRead, UnreadCommentCount};
use crate::models::comment::{Comment, NewComment, UpdateComment};
use crate::models::error::ChaosError;
use crate::models::transaction::DBTransaction;
use chrono::Utc;
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

    /// Marks a comment as read for the authenticated user.
    ///
    /// # Arguments
    /// * `application_id` - ID of the application that owns the comment.
    /// * `comment_id` - ID of the comment being marked as read.
    /// * `admin` - Authenticated user allowed to review the application.
    /// * `transaction` - Database transaction wrapper.
    ///
    /// # Returns
    /// Returns an OK message on success.
    pub async fn mark_comment_read(
        Path((application_id, comment_id)): Path<(i64, i64)>,
        admin: ApplicationReviewerGivenApplicationId,
        mut transaction: DBTransaction<'_>,
    ) -> Result<impl IntoResponse, ChaosError> {
        CommentLastRead::insert_or_update(
            comment_id,
            application_id,
            admin.user_id,
            Utc::now(),
            &mut transaction.tx,
        )
        .await?;

        transaction.tx.commit().await?;

        Ok(AppMessage::OkMessage("Successfully updated comment last read"))
    }

    /// Marks all comments on an application as read for the authenticated user.
    ///
    /// Used when the reviewer opens the discussion thread, clearing their unread count.
    ///
    /// # Arguments
    /// * `application_id` - ID of the application whose comments are being marked read.
    /// * `admin` - Authenticated user allowed to review the application.
    /// * `transaction` - Database transaction wrapper.
    ///
    /// # Returns
    /// Returns an OK message on success.
    pub async fn mark_all_comments_read(
        Path(application_id): Path<i64>,
        admin: ApplicationReviewerGivenApplicationId,
        mut transaction: DBTransaction<'_>,
    ) -> Result<impl IntoResponse, ChaosError> {
        CommentLastRead::mark_all_read(
            application_id,
            admin.user_id,
            Utc::now(),
            &mut transaction.tx,
        )
        .await?;

        transaction.tx.commit().await?;

        Ok(AppMessage::OkMessage("Successfully marked all comments read"))
    }

    /// Gets the number of unread comments on an application for the authenticated user.
    ///
    /// # Arguments
    /// * `application_id` - ID of the application to count unread comments for.
    /// * `admin` - Authenticated user allowed to review the application.
    /// * `transaction` - Database transaction wrapper.
    ///
    /// # Returns
    /// The unread comment count.
    pub async fn get_unread_comment_count(
        Path(application_id): Path<i64>,
        admin: ApplicationReviewerGivenApplicationId,
        mut transaction: DBTransaction<'_>,
    ) -> Result<impl IntoResponse, ChaosError> {
        let count =
            CommentLastRead::get_unread_count(application_id, admin.user_id, &mut transaction.tx)
                .await?;

        transaction.tx.commit().await?;

        Ok(Json(UnreadCommentCount { count }))
    }
}
