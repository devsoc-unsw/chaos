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
    // TODO: what's the point of storing created_at and updated_at if they are not accessible to users through endpoints?
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// TODO: Does the user have to provide rater user id in their JSON? How do they get that? can't we get that in the RatingsHandler::create_rating method?
#[derive(Deserialize, Serialize)]
pub struct NewRating {
    pub application_id: i64,
    pub rater_user_id: i64,
    pub rating: i32,
}

#[derive(Deserialize, Serialize)]
pub struct RatingDetails {
    pub id: i64,
    pub rating: i32,
    pub created_at: DateTime<Utc>,
}

#[derive(Deserialize, Serialize)]
pub struct RatingsDetails {
    // TODO: should this be: Vec<Rating> instead?
    pub ratings: Vec<RatingDetails>,
}

impl Rating {
    /// Create a new rating.
    pub async fn create(
        new_rating: NewRating,
        mut snowflake_generator: SnowflakeIdGenerator,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<(), ChaosError> {
        let rating_id = snowflake_generator.generate();
        let application_id = new_rating.application_id;
        let rater_user_id = new_rating.rater_user_id;
        let rating = new_rating.rating;

        sqlx::query!(
            "
            INSERT INTO application_ratings (id, application_id, rater_id, rating)
                VALUES ($1, $2, $3, $4)
        ",
            rating_id,
            application_id,
            rater_user_id,
            rating
        )
        .execute(transaction.deref_mut())
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
            SELECT id, rating, created_at
                FROM application_ratings
                WHERE id = $1
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
    ) -> Result<RatingsDetails, ChaosError> {
        let ratings = sqlx::query_as!(
            RatingDetails,
            "
            SELECT id, rating, created_at
                FROM application_ratings
                WHERE application_id = $1
        ",
            application_id
        )
        .fetch_all(transaction.deref_mut())
        .await?;

        Ok(RatingsDetails { ratings })
    }

    pub async fn delete(
        rating_id: i64,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<(), ChaosError> {
        // TODO: fix sth kavika wanted fixed.
        sqlx::query!(
            "
            DELETE FROM application_ratings WHERE id = $1
        ",
            rating_id
        )
        .execute(transaction.deref_mut())
        .await?;

        Ok(())
    }
}
