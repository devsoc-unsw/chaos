//! Application rating management for Chaos.
//! 
//! This module provides functionality for managing ratings and comments
//! on applications, including creation, updates, and retrieval of rating information.

use crate::models::error::ChaosError;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use snowflake::SnowflakeIdGenerator;
use sqlx::{FromRow, Postgres, Transaction};
use std::ops::DerefMut;

/// Represents a category rating in the database
/// 
/// Admin of a campaign can create category rating
/// includes the name of the category, 
#[derive(Deserialize, Serialize, Clone, FromRow, Debug)]
pub struct CategoryRating {
    /// Unique identifier for the category
    #[serde(serialize_with = "crate::models::serde_string::serialize")]
    pub id: i64,
    /// ID of the campaign where the category is being created 
    #[serde(serialize_with = "crate::models::serde_string::serialize")]
    pub campaign_id: i64,
    /// Name of the category that it is being created for the campaign
    pub name: String,
}

/// Data structure for creating a new Category Rating
///
/// Only creates a new category in a rating, NO RATING and NO Comments
#[derive(Deserialize, Serialize)]
pub struct NewCategoryRating {
    /// Name of the category
    pub name: String,
}

/// 
/// A rating is an evaluation of an application by a reviewer,
/// This covers the ApplicationRating part WITHOUT the numerical rating
#[derive(Deserialize, Serialize, Clone, FromRow, Debug)]
pub struct ApplicationRating {
    /// Unique identifier for the rating
    #[serde(serialize_with = "crate::models::serde_string::serialize")]
    pub id: i64,
    /// ID of the application being rated
    #[serde(serialize_with = "crate::models::serde_string::serialize")]
    pub application_id: i64,
    /// Optional comments about the application
    pub comment: Option<String>,
    /// When the rating was created
    pub created_at: DateTime<Utc>,
    /// When the rating was last updated
    pub updated_at: DateTime<Utc>,
}

/// Data structure for creating a new Application Rating.
/// 
/// This struct contains the fields needed to create a new application_rating,
/// ONLY covers the comment
/// excluding Numerical rating and system generated fields.
#[derive(Deserialize, Serialize)]
pub struct NewApplicationRating {
    /// Optional comments about the application
    pub comment: Option<String>,
}

/// 
/// A rating is an evaluation of an application by a reviewer,
/// This covers the ApplicationCategoryRating part WITH the numerical rating
/// BASED ON the category of the ratings
#[derive(Deserialize, Serialize, Clone, FromRow, Debug)]
pub struct ApplicationCateogryRating {
    /// Unique identifier for the rating
    #[serde(serialize_with = "crate::models::serde_string::serialize")]
    pub id: i64,
    /// ID of the application_rating being rated under ApplicationRating
    #[serde(serialize_with = "crate::models::serde_string::serialize")]
    pub application_rating_id: i64,
    /// ID of the category being rated under
    #[serde(serialize_with = "crate::models::serde_string::serialize")]
    pub campaign_rating_category_id: i64,
    /// Numerical score based on the rating
    pub rating: i32,
    /// When the rating was created
    pub created_at: DateTime<Utc>,
    /// When the rating was last updated
    pub updated_at: DateTime<Utc>,
}

/// Data structure for creating a new Application Rating.
/// 
/// This struct contains the fields needed to create a new application_rating,
/// ONLY covers the comment
/// excluding Numerical rating and system generated fields.
#[derive(Deserialize, Serialize)]
pub struct NewApplicationCateogryRating {
    /// ID of the category being rated
    #[serde(serialize_with = "crate::models::serde_string::serialize")]
    pub campaign_rating_category_id: i64,
    /// Numerical score based on the rating
    pub rating: i32,
}

/// Detailed view of a rating's information.
/// 
/// This struct provides a complete view of a rating's details,
/// includes the rater's name, used primarily for API responses.
#[derive(Deserialize, Serialize)]
pub struct RatingDetails {
    /// Unique identifier for the rating
    #[serde(serialize_with = "crate::models::serde_string::serialize")]
    pub id: i64,
    /// ID of the user who created the rating
    #[serde(serialize_with = "crate::models::serde_string::serialize")]
    pub rater_id: i64,
    /// Name of the user who created the rating
    pub rater_name: String,
    /// Optional comments about the application
    pub comment: Option<String>,
    /// Category ratings for this application rating (IMPORTANT TO ADD FOR rating numerical score)
    pub category_ratings: Vec<CategoryRatingDetail>,
    /// When the rating was last updated
    pub updated_at: DateTime<Utc>,
}

/// Detail of a single category rating
#[derive(Deserialize, Serialize)]
pub struct CategoryRatingDetail {
    /// ID of the category
    #[serde(serialize_with = "crate::models::serde_string::serialize")]
    pub campaign_rating_category_id: i64,
    /// Name of the category
    pub category_name: String,
    /// Numerical rating value
    pub rating: i32,
}

/// Collection of ratings for an application.
/// 
/// This struct represents all ratings associated with a specific application,
/// used for API responses.
#[derive(Deserialize, Serialize)]
pub struct ApplicationRatings {
    /// List of ratings for the application
    pub ratings: Vec<RatingDetails>,
}

impl Rating {
    /// ----------------------- CateogoryRating Operations ---------------------------
    /// Creates a new category for a campaign for rating
    pub async fn create_category(
        new_category: NewCategoryRating,
        campaign_id: i64,
        snowflake_generator: &mut SnowflakeIdGenerator,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<CategoryRating, ChaosError> {
        let id = snowflake_generator.real_time_generate();

        let category = sqlx::query_as!(
            CategoryRating,
            "
            INSERT INTO campaign_rating_categories (id, name, campaign_id)
                VALUES ($1, $2, $3)
            ",
            id,
            new_category.name,
            campaign_id
        )
        .execute(transaction.deref_mut())
        .await?;

        Ok(id)
    }

    /// Gets all categories for a campaign
    pub async fn get_categories_by_campaign(
        campaign_id: i64,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<Vec<CategoryRating>, ChaosError> {
        let categories = sqlx::query_as!(
            CategoryRating,
            "
            SELECT id, name, campaign_id
            FROM campaign_rating_categories
            WHERE campaign_id = $1
            ",
            campaign_id
        )
        .fetch_all(transaction.deref_mut())
        .await?;

        Ok(categories)
    }

    /// Deletes a category
    pub async fn delete_category(
        category_id: i64,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<(), ChaosError> {
        let _ = sqlx::query!(
            "
            DELETE FROM campaign_rating_categories WHERE id = $1
            RETURNING id
            ",
            category_id
        )
        .fetch_one(transaction.deref_mut())
        .await?;

        Ok(())
    }

    /// ------------------- ApplicationRating Operations ----------------

    /// Creates a new rating for an application.
    /// 
    /// # Arguments
    /// * `new_rating` - The rating data to create
    /// * `application_id` - The ID of the application being rated
    /// * `rater_id` - The ID of the user creating the rating
    /// * `snowflake_generator` - A generator for creating unique IDs
    /// * `transaction` - A mutable reference to the database transaction
    /// 
    /// # Returns
    /// Returns a `Result` containing either:
    /// * `Ok(())` - If the rating was created successfully
    /// * `Err(ChaosError)` - An error if creation fails
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

    /// Updates an existing rating.
    /// 
    /// # Arguments
    /// * `rating_id` - The ID of the rating to update
    /// * `updated_rating` - The new rating data
    /// * `transaction` - A mutable reference to the database transaction
    /// 
    /// # Returns
    /// Returns a `Result` containing either:
    /// * `Ok(())` - If the rating was updated successfully
    /// * `Err(ChaosError)` - An error if update fails
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

    /// Retrieves a rating by its ID.
    /// 
    /// # Arguments
    /// * `rating_id` - The ID of the rating to retrieve
    /// * `transaction` - A mutable reference to the database transaction
    /// 
    /// # Returns
    /// Returns a `Result` containing either:
    /// * `Ok(RatingDetails)` - The requested rating details
    /// * `Err(ChaosError)` - An error if retrieval fails
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

    /// Retrieves a rating by its ID.
    /// 
    /// # Arguments
    /// * `application_id` - The ID of the application the rating is for
    /// * `rating_id` - The ID of the rating to retrieve
    /// * `transaction` - A mutable reference to the database transaction
    /// 
    /// # Returns
    /// Returns a `Result` containing either:
    /// * `Ok(RatingDetails)` - The requested rating details
    /// * `Err(ChaosError)` - An error if retrieval fails
    pub async fn get_rating_by_rater_id(
        application_id: i64,
        rater_id: i64,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<RatingDetails, ChaosError> {
        let rating = sqlx::query_as!(
            RatingDetails,
            "
            SELECT r.id, rater_id, u.name as rater_name, r.rating, r.comment, r.updated_at
                FROM application_ratings r
                JOIN users u ON u.id = r.rater_id
                WHERE r.application_id = $1 AND r.rater_id = $2
        ",
            application_id,
            rater_id
        )
        .fetch_one(transaction.deref_mut())
        .await?;

        Ok(rating)
    }

    /// Retrieves all ratings for a specific application.
    /// 
    /// # Arguments
    /// * `application_id` - The ID of the application to get ratings for
    /// * `transaction` - A mutable reference to the database transaction
    /// 
    /// # Returns
    /// Returns a `Result` containing either:
    /// * `Ok(ApplicationRatings)` - All ratings for the application
    /// * `Err(ChaosError)` - An error if retrieval fails
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

    /// Deletes a rating.
    /// 
    /// # Arguments
    /// * `rating_id` - The ID of the rating to delete
    /// * `transaction` - A mutable reference to the database transaction
    /// 
    /// # Returns
    /// Returns a `Result` containing either:
    /// * `Ok(())` - If the rating was deleted successfully
    /// * `Err(ChaosError)` - An error if deletion fails
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
