use crate::models::error::ChaosError;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use snowflake::SnowflakeIdGenerator;
use sqlx::{FromRow, Postgres, Transaction};
use std::ops::DerefMut;

#[derive(Deserialize, Serialize, Clone, FromRow, Debug)]
pub struct Rating {
    pub id: i64,
    pub application_id: i64,
    pub rater_user_id: i64,
    pub rating: i32,
    pub comment: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Deserialize, Serialize)]
pub struct NewRating {
    pub rating: i32,
    pub comment: Option<String>,
}

#[derive(Deserialize, Serialize)]
pub struct RatingDetails {
    pub id: i64,
    pub rater_id: i64,
    pub rater_name: String,
    pub rating: i32,
    pub comment: Option<String>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Deserialize, Serialize)]
pub struct ApplicationRatings {
    pub ratings: Vec<RatingDetails>,
}

impl Rating {
    /// Create a new rating.
    pub async fn create(
        new_rating: NewRating,
        application_id: i64,
        rater_id: i64,
        snowflake_generator: &mut SnowflakeIdGenerator,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<(), ChaosError> {
        let rating_id = snowflake_generator.real_time_generate();
        let rating = new_rating.rating;
        let comment = new_rating.comment;

        sqlx::query!(
            "
            INSERT INTO application_ratings (id, application_id, rater_id, rating, comment)
                VALUES ($1, $2, $3, $4, $5)
        ",
            rating_id,
            application_id,
            rater_id,
            rating,
            comment
        )
        .execute(transaction.deref_mut())
        .await?;

        Ok(())
    }

    /// Create a new rating.
    pub async fn update(
        rating_id: i64,
        updated_rating: NewRating,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<(), ChaosError> {
        let rating = updated_rating.rating;
        let comment = updated_rating.comment;
        let current_time = Utc::now();

        let _ = sqlx::query!(
            "
            UPDATE application_ratings
            SET rating = $2, comment = $3, updated_at = $4
            WHERE id = $1
            RETURNING id
        ",
            rating_id,
            rating,
            comment,
            current_time
        )
        .fetch_one(transaction.deref_mut())
        .await?;

        Ok(())
    }

    pub async fn get_rating(
        rating_id: i64,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<RatingDetails, ChaosError> {
        let rating = sqlx::query_as!(
            RatingDetails,
            "
            SELECT r.id, rater_id, u.name as rater_name, r.rating, r.comment, r.updated_at
                FROM application_ratings r
                JOIN users u ON u.id = r.rater_id
                WHERE r.id = $1
        ",
            rating_id
        )
        .fetch_one(transaction.deref_mut())
        .await?;

        Ok(rating)
    }

    /// Get all ratings for a certain application.
    pub async fn get_all_ratings_from_application_id(
        application_id: i64,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<ApplicationRatings, ChaosError> {
        let ratings = sqlx::query_as!(
            RatingDetails,
            "
            SELECT r.id, rater_id, u.name as rater_name, r.rating, r.comment, r.updated_at
                FROM application_ratings r
                JOIN users u ON u.id = r.rater_id
                WHERE r.application_id = $1
        ",
            application_id
        )
        .fetch_all(transaction.deref_mut())
        .await?;

        Ok(ApplicationRatings { ratings })
    }

    pub async fn delete(
        rating_id: i64,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<(), ChaosError> {
        // Throws error if rating id doesn't exist.
        let _ = sqlx::query!(
            "
            DELETE FROM application_ratings WHERE id = $1
            RETURNING id
        ",
            rating_id
        )
        .fetch_one(transaction.deref_mut())
        .await?;

        Ok(())
    }
}
