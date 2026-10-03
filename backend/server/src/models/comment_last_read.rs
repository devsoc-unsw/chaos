//! Comment last read tracking for the Chaos application.
//!
//! This module provides database access for storing when a user last read a comment.

use crate::models::error::ChaosError;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::{FromRow, Postgres, Transaction};
use std::ops::DerefMut;

/// Tracks when a user last read a comment.
#[derive(Debug, Clone, FromRow, Serialize, Deserialize)]
pub struct CommentLastRead {
    /// Unique identifier of the comment.
    #[serde(serialize_with = "crate::models::serde_string::serialize")]
    pub comment_id: i64,
    /// Unique identifier of the user.
    #[serde(serialize_with = "crate::models::serde_string::serialize")]
    pub user_id: i64,
    /// Timestamp when the comment was last read.
    pub last_read: DateTime<Utc>,
}

/// Number of comments on an application that the current user has not yet read.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UnreadCommentCount {
    /// Count of unread comments.
    pub count: i64,
}

impl CommentLastRead {
    /// Inserts or updates the last-read timestamp for a comment and user.
    pub async fn insert_or_update(
        comment_id: i64,
        application_id: i64,
        user_id: i64,
        last_read: DateTime<Utc>,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<(), ChaosError> {
        let result = sqlx::query!(
            r#"
                INSERT INTO comment_last_read (comment_id, user_id, last_read)
                SELECT $1, $2, $3
                WHERE EXISTS (
                    SELECT 1
                    FROM comments
                    WHERE id = $1 AND application_id = $4
                )
                ON CONFLICT (comment_id, user_id)
                DO UPDATE SET last_read = EXCLUDED.last_read
            "#,
            comment_id,
            user_id,
            last_read,
            application_id
        )
        .execute(transaction.deref_mut())
        .await?;

        if result.rows_affected() == 0 {
            return Err(ChaosError::NotFound);
        }

        Ok(())
    }

    /// Marks every comment on an application as read for a user.
    ///
    /// Upserts a read receipt for each comment belonging to the application, so the
    /// user's unread count for that application drops to zero. Used when the user opens
    /// the discussion thread.
    ///
    /// # Arguments
    /// * `application_id` - The application whose comments should be marked read.
    /// * `user_id` - The user reading the comments.
    /// * `last_read` - Timestamp to record as the read time.
    /// * `transaction` - Database transaction to use.
    pub async fn mark_all_read(
        application_id: i64,
        user_id: i64,
        last_read: DateTime<Utc>,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<(), ChaosError> {
        sqlx::query!(
            r#"
                INSERT INTO comment_last_read (comment_id, user_id, last_read)
                SELECT c.id, $2, $3
                FROM comments c
                WHERE c.application_id = $1
                ON CONFLICT (comment_id, user_id)
                DO UPDATE SET last_read = EXCLUDED.last_read
            "#,
            application_id,
            user_id,
            last_read
        )
        .execute(transaction.deref_mut())
        .await?;

        Ok(())
    }

    /// Counts the comments on an application that a user has not yet read.
    ///
    /// A comment is considered unread if the user is not its author and has no read
    /// receipt for it. This backs the unread badge on the discussion icon.
    ///
    /// # Arguments
    /// * `application_id` - The application to count unread comments for.
    /// * `user_id` - The user whose unread count is requested.
    /// * `transaction` - Database transaction to use.
    ///
    /// # Returns
    /// The number of unread comments.
    pub async fn get_unread_count(
        application_id: i64,
        user_id: i64,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<i64, ChaosError> {
        let count = sqlx::query!(
            r#"
                SELECT COUNT(*) AS "count!"
                FROM comments c
                WHERE c.application_id = $1
                  AND c.author_id != $2
                  AND NOT EXISTS (
                      SELECT 1
                      FROM comment_last_read clr
                      WHERE clr.comment_id = c.id AND clr.user_id = $2
                  )
            "#,
            application_id,
            user_id
        )
        .fetch_one(transaction.deref_mut())
        .await?
        .count;

        Ok(count)
    }
}
