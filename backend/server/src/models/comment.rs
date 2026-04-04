//! Comment management for the Chaos application.
//!
//! This module provides database access for CRUD operations on application comments.

use crate::models::error::ChaosError;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use snowflake::SnowflakeIdGenerator;
use sqlx::{FromRow, Postgres, Transaction};
use std::ops::DerefMut;

/// A comment authored by a user on a specific application.
#[derive(Deserialize, Serialize, Clone, FromRow, Debug)]
pub struct Comment {
    /// Unique identifier for the comment.
    #[serde(serialize_with = "crate::models::serde_string::serialize")]
    pub id: i64,
    /// The comment body.
    pub body: String,
    /// The user who authored the comment.
    #[serde(serialize_with = "crate::models::serde_string::serialize")]
    pub author_id: i64,
    /// The application this comment belongs to.
    #[serde(serialize_with = "crate::models::serde_string::serialize")]
    pub application_id: i64,
    /// When the comment was created.
    pub created_at: DateTime<Utc>,
}

/// A comment authored by a user on a specific application for frontend representation
#[derive(Deserialize, Serialize, Clone, FromRow, Debug)]
pub struct CommentDetails {
    /// Unique identifier for the comment.
    #[serde(serialize_with = "crate::models::serde_string::serialize")]
    pub id: i64,
    /// The name of the author.
    pub name: String,
    /// The comment body.
    pub body: String,
    /// The user who authored the comment.
    #[serde(serialize_with = "crate::models::serde_string::serialize")]
    pub author_id: i64,
    /// When the comment was created.
    pub created_at: DateTime<Utc>,
}

/// Request payload for creating a new comment.
#[derive(Deserialize, Serialize)]
pub struct NewComment {
    /// The comment body.
    pub body: String,
}

/// Request payload for editing an existing comment.
#[derive(Deserialize, Serialize)]
pub struct UpdateComment {
    /// The updated comment body.
    pub body: String,
}

impl Comment {
    /// Creates a new comment for an application.
    ///
    /// # Arguments
    /// * `body` - The comment body.
    /// * `author_id` - The authenticated user creating the comment.
    /// * `application_id` - The application to attach the comment to.
    /// * `snowflake_generator` - Generator for unique comment IDs.
    /// * `transaction` - Database transaction to use.
    ///
    /// # Returns
    /// Returns the newly created comment ID.
    pub async fn create(
        body: String,
        author_id: i64,
        application_id: i64,
        snowflake_generator: &mut SnowflakeIdGenerator,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<i64, ChaosError> {
        let id = snowflake_generator.real_time_generate();

        sqlx::query!(
            r#"
                INSERT INTO comments (id, body, author_id, application_id)
                VALUES ($1, $2, $3, $4)
            "#,
            id,
            body,
            author_id,
            application_id
        )
        .execute(transaction.deref_mut())
        .await?;

        Ok(id)
    }

    /// Retrieves a comment by its ID.
    ///
    /// # Arguments
    /// * `id` - The comment ID.
    /// * `transaction` - Database transaction to use.
    ///
    /// # Returns
    /// The comment details.
    pub async fn get(
        id: i64,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<Comment, ChaosError> {
        let comment = sqlx::query_as!(
            Comment,
            r#"
                SELECT
                    id,
                    body,
                    author_id,
                    application_id,
                    created_at
                FROM comments
                WHERE id = $1
            "#,
            id
        )
        .fetch_one(transaction.deref_mut())
        .await?;

        Ok(comment)
    }

    /// Updates an existing comment.
    ///
    /// The update is scoped to both the comment ID and the author, so users can only edit their own comments.
    ///
    /// # Arguments
    /// * `application_id` - The application the comment belongs to (used for extra scoping/consistency).
    /// * `transaction` - Database transaction to use.
    pub async fn get_comments_by_application(
        application_id: i64,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<Vec<CommentDetails>, ChaosError> {
        let application_comments_by_postdate = sqlx::query_as!(
            CommentDetails,
            "SELECT u.name, c.id, c.author_id, c.body, c.created_at FROM comments c INNER JOIN
            users u ON c.author_id = u.id
            WHERE c.application_id = $1
            ORDER BY c.created_at ASC",
            application_id
        )
        .fetch_all(transaction.deref_mut())
        .await?;

        Ok(application_comments_by_postdate)
    }

    /// Updates an existing comment.
    ///
    /// The update is scoped to both the comment ID and the author, so users can only edit their own comments.
    ///
    /// # Arguments
    /// * `id` - The comment ID.
    /// * `author_id` - The authenticated user performing the edit.
    /// * `application_id` - The application the comment belongs to (used for extra scoping/consistency).
    /// * `body` - The new comment body.
    /// * `transaction` - Database transaction to use.
    pub async fn update(
        id: i64,
        author_id: i64,
        application_id: i64,
        body: String,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<(), ChaosError> {
        let result = sqlx::query!(
            r#"
                UPDATE comments
                SET body = $1
                WHERE id = $2 AND author_id = $3 AND application_id = $4
            "#,
            body,
            id,
            author_id,
            application_id
        )
        .execute(transaction.deref_mut())
        .await?;

        if result.rows_affected() == 0 {
            return Err(ChaosError::NotFound);
        }

        Ok(())
    }

    /// Deletes an existing comment.
    ///
    /// The delete is scoped to both the comment ID and the author, so users can only delete their own comments.
    ///
    /// # Arguments
    /// * `id` - The comment ID.
    /// * `author_id` - The authenticated user performing the delete.
    /// * `application_id` - The application the comment belongs to (used for extra scoping/consistency).
    /// * `transaction` - Database transaction to use.
    pub async fn delete(
        id: i64,
        author_id: i64,
        application_id: i64,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<(), ChaosError> {
        let result = sqlx::query!(
            r#"
                DELETE FROM comments
                WHERE id = $1 AND author_id = $2 AND application_id = $3
            "#,
            id,
            author_id,
            application_id
        )
        .execute(transaction.deref_mut())
        .await?;

        if result.rows_affected() == 0 {
            return Err(ChaosError::NotFound);
        }

        Ok(())
    }
}
