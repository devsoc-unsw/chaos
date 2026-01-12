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
/// This covers the ApplicationRating part WITHOUT the numerical rating, only the OPTIONAL COMMENT
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
pub struct ApplicationCategoryRating {
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

/// Data structure for creating a new Category Application Rating.
/// 
/// This struct contains the fields needed to create a new category rating for application rating
/// WITH the numerical score
#[derive(Deserialize, Serialize)]
pub struct NewApplicationCategoryRating {
    /// ID of the category being rated (TAKEN FROM FRONTEND the category ID )
    #[serde(deserialize_with = "crate::models::serde_string::deserialize")]
    pub campaign_rating_category_id: i64,
    /// Numerical score based on the rating
    pub rating: i32,
}

/// Data structure for updating a category rating score.
#[derive(Deserialize, Serialize)]
pub struct UpdateCategoryRating {
    /// Numerical score based on the rating
    pub rating: i32,
}

/// DEFINITIVE ADD NEW RATING
/// Data structure for creating a complete rating with comment and category scores.
#[derive(Deserialize, Serialize)]
pub struct NewRating {
    /// Optional comments about the application
    pub comment: Option<String>,
    /// Category ratings with numerical scores
    pub category_ratings: Vec<NewApplicationCategoryRating>,
}

/// Detailed view of a rating's information.
/// 
/// This struct provides a complete view of a rating's details,
/// includes the rater's name, used primarily for API responses.
#[derive(Debug, Deserialize, Serialize, FromRow)]
pub struct RatingDetails {
    /// Unique identifier for the application rating we are looking at (NOT CATEGORY RATINGS)
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
    pub category_ratings: Option<sqlx::types::Json<Vec<CategoryRatingDetail>>>,
    /// When the rating was last updated
    pub updated_at: DateTime<Utc>,
}

/// Detail of a single category rating
#[derive(Debug, Deserialize, Serialize)]
pub struct CategoryRatingDetail {
    /// ID of the application category rating record
    #[serde(serialize_with = "crate::models::serde_string::serialize")]
    pub id: i64,
    /// ID of the campaign rating category
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

pub struct Rating;

impl Rating {
    /// ----------------------- CateogoryRating Operations ---------------------------

    /// Creates a new category for a campaign for rating
    /// 
    /// # Arguments
    /// * `new_category` - The category name that is created
    /// * `campaign_id` - Campaign that is adding the new category for ratings
    /// * `snowflake_generator` - A generator for creating unique IDs
    /// * `transaction` - A mutable reference to the database transaction
    /// 
    /// # Returns
    /// Returns a `Result` containing either:
    /// * `Ok(())` - If the category of a campaign was created successfully
    /// * `Err(ChaosError)` - An error if creation fails
    /// 
    pub async fn create_category(
        new_category: NewCategoryRating,
        campaign_id: i64,
        snowflake_generator: &mut SnowflakeIdGenerator,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<i64, ChaosError> {
        let id = snowflake_generator.real_time_generate();

        sqlx::query!(
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
    /// 
    /// # Arguments
    /// 
    /// * 
    /// * `transaction` - Database transaction to use
    /// 
    /// # Returns
    /// 
    /// * `Result<Vec<Campaign>, ChaosError>` - List of campaigns or error
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

    /// Updates an existing category name by category.
    /// 
    /// # Arguments
    /// * `category_id` - The ID of the category to update
    /// * `updated_category` - The new category (ONLY INCLUDES NAME)
    /// * `transaction` - A mutable reference to the database transaction
    /// 
    /// # Returns
    /// Returns a `Result` containing either:
    /// * `Ok(())` - If the category was updated successfully
    /// * `Err(ChaosError)` - An error if update fails
    pub async fn update_category(
        category_id: i64,
        updated_category: NewCategoryRating,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<(), ChaosError> {
        let name = updated_category.name;

        let _ = sqlx::query!(
            "
            UPDATE campaign_rating_categories
            SET name = $2
            WHERE id = $1
            RETURNING id
        ",
            category_id,
            name,
        )
        .fetch_one(transaction.deref_mut())
        .await?;

        Ok(())
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

    /// Creates a new application rating in ApplicationRating WITHOUT numerical rating score
    /// Ensures that the application rating must be unique for rater_id and application_id
    /// 
    /// # Arguments
    /// * `new_rating` - The rating data to create (ONLY HAVE THE COMMENT)
    /// * `application_id` - The ID of the application being rated
    /// * `rater_id` - The ID of the user creating the rating
    /// * `snowflake_generator` - A generator for creating unique IDs
    /// * `transaction` - A mutable reference to the database transaction
    /// 
    /// # Returns
    /// Returns a `Result` containing either:
    /// * `Ok(())` - If the rating was created successfully
    /// * `Err(ChaosError)` - An error if creation fails
    pub async fn create_application_rating(
        new_rating: NewApplicationRating,
        application_id: i64,
        rater_id: i64,
        snowflake_generator: &mut SnowflakeIdGenerator,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<i64, ChaosError> {
        let rating_id = snowflake_generator.real_time_generate();
        let comment = new_rating.comment;

        sqlx::query!(
            "
            INSERT INTO application_ratings (id, application_id, rater_id, comment)
                VALUES ($1, $2, $3, $4)
        ",
            rating_id,
            application_id,
            rater_id,
            comment
        )
        .execute(transaction.deref_mut())
        .await?;

        Ok(rating_id)
    }

    /// Updates an existing application_rating ONLY THRU COMMENT.
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
    pub async fn update_application_rating(
        rating_id: i64,
        updated_rating: NewApplicationRating,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<(), ChaosError> {
        let comment = updated_rating.comment;
        let current_time = Utc::now();

        let _ = sqlx::query!(
            "
            UPDATE application_ratings
            SET comment = $2, updated_at = $3
            WHERE id = $1
            RETURNING id
        ",
            rating_id,
            comment,
            current_time
        )
        .fetch_one(transaction.deref_mut())
        .await?;

        Ok(())
    }

    /// Deletes an application_rating.
    /// 
    /// # Arguments
    /// * `rating_id` - The ID of the rating to delete
    /// * `transaction` - A mutable reference to the database transaction
    /// 
    /// # Returns
    /// Returns a `Result` containing either:
    /// * `Ok(())` - If the rating was deleted successfully
    /// * `Err(ChaosError)` - An error if deletion fails
    pub async fn delete_application_rating(
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

    // /// -------------- GET requests for ApplicationRating: ONLY COMMENT ----------------------
    /////  ============================ NOT NEEDED (COMMNET IS IN ANOTHER FUNCTION ALR)===================

    // /// Retrieves a rating by its ID, able to see which application is being rated,
    // /// ONLY THE COMMENT IS VIEWED, 
    // /// NOT Vector of numerical scores
    // /// 
    // /// # Arguments
    // /// * `rating_id` - The ID of the rating to retrieve
    // /// * `transaction` - A mutable reference to the database transaction
    // /// 
    // /// # Returns
    // /// Returns a `Result` containing either:
    // /// * `Ok(RatingDetails)` - The requested rating details
    // /// * `Err(ChaosError)` - An error if retrieval fails
    // pub async fn get_comment_rating(
    //     rating_id: i64,
    //     transaction: &mut Transaction<'_, Postgres>,
    // ) -> Result<RatingDetails, ChaosError> {
    //     let rating = sqlx::query_as!(
    //         RatingDetails,
    //         "
    //         SELECT r.id, rater_id, u.name as rater_name, r.comment, r.updated_at
    //             FROM application_ratings r
    //             JOIN users u ON u.id = r.rater_id
    //             WHERE r.id = $1
    //     ",
    //         rating_id
    //     )
    //     .fetch_one(transaction.deref_mut())
    //     .await?;

    //     Ok(rating)
    // }

    // /// Retrieves a rating by application_ID.  (UNCONFIRMED: Want it to be seperate?)
    // /// ONLY THE COMMENT IS VIEWED, 
    // /// NOT Vector of numerical scores
    // /// 
    // /// # Arguments
    // /// * `application_id` - The ID of the application the rating is for
    // /// * `rater_id` - The ID of the rater
    // /// * `transaction` - A mutable reference to the database transaction
    // /// 
    // /// # Returns
    // /// Returns a `Result` containing either:
    // /// * `Ok(RatingDetails)` - The requested rating details
    // /// * `Err(ChaosError)` - An error if retrieval fails
    // pub async fn get_comment_rating_by_application_id(
    //     application_id: i64,
    //     transaction: &mut Transaction<'_, Postgres>,
    // ) -> Result<RatingDetails, ChaosError> {
    //     let rating = sqlx::query_as!(
    //         RatingDetails,
    //         "
    //         SELECT r.id, rater_id, u.name as rater_name, r.comment, r.updated_at
    //             FROM application_ratings r
    //             JOIN users u ON u.id = r.rater_id
    //             WHERE r.application_id = $1
    //     ",
    //         application_id,
    //     )
    //     .fetch_one(transaction.deref_mut())
    //     .await?;

    //     Ok(rating)
    // }

    // ------------------- GET requests for ApplicationRating: Get Rating Details -------------------

    /// Retrieves detailed rating information with 
    // all category ratings given application and rater
    ///
    /// # Arguments
    /// * `application_id` - The ID of the application
    /// * `rater_id` - The ID of the rater
    /// * `transaction` - A mutable reference to the database transaction
    /// 
    /// # Returns
    /// Returns a `Result` containing either:
    /// * `Ok(RatingDetails)` - The detailed rating information
    /// * `Err(ChaosError)` - An error if retrieval fails
    pub async fn get_rating_details(
        application_id: i64,
        rater_id: i64,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<RatingDetails, ChaosError> {
        let rating_details = sqlx::query_as!(
            RatingDetails,
            r#"
            SELECT ar.id, ar.rater_id, u.name as rater_name, ar.comment, ar.updated_at,
                COALESCE(jsonb_agg(jsonb_build_object('campaign_rating_category_id', arc.campaign_rating_category_id, 
                'category_name', crc.name,
                'rating', arc.rating)
                ) FILTER (WHERE arc.id IS NOT NULL),
                '[]'::jsonb
            ) as "category_ratings!: sqlx::types::Json<Vec<CategoryRatingDetail>>"
            FROM application_ratings ar
            JOIN users u ON u.id = ar.rater_id
            LEFT JOIN application_rating_category_ratings arc ON arc.application_rating_id = ar.id
            LEFT JOIN campaign_rating_categories crc ON crc.id = arc.campaign_rating_category_id
            WHERE ar.application_id = $1 AND ar.rater_id = $2
            GROUP BY ar.id, u.name
            "#,
            application_id,
            rater_id
        )
        .fetch_one(transaction.deref_mut())
        .await?;

        Ok(rating_details)
    }

    /// Retrieves all ratings for an application with all category ratings included
    ///
    /// # Arguments
    /// * `application_id` - The ID of the application
    /// * `transaction` - A mutable reference to the database transaction
    /// 
    /// # Returns
    /// Returns a `Result` containing either:
    /// * `Ok(Vec<RatingDetails>)` - All ratings for the application
    /// * `Err(ChaosError)` - An error if retrieval fails
    pub async fn get_all_ratings_from_application_id(
        application_id: i64,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<Vec<RatingDetails>, ChaosError> {
        let ratings = sqlx::query_as!(
            RatingDetails,
            r#"
            SELECT ar.id, ar.rater_id, u.name as rater_name, ar.comment, ar.updated_at,
                COALESCE(jsonb_agg(jsonb_build_object('id', arc.id, 
                'campaign_rating_category_id', arc.campaign_rating_category_id, 
                'category_name', crc.name,
                'rating', arc.rating)
                ) FILTER (WHERE arc.id IS NOT NULL),
                '[]'::jsonb
            ) as "category_ratings!: sqlx::types::Json<Vec<CategoryRatingDetail>>"
            FROM application_ratings ar
            JOIN users u ON u.id = ar.rater_id
            LEFT JOIN application_rating_category_ratings arc ON arc.application_rating_id = ar.id
            LEFT JOIN campaign_rating_categories crc ON crc.id = arc.campaign_rating_category_id
            WHERE ar.application_id = $1
            GROUP BY ar.id, u.name
            "#,
            application_id
        )
        .fetch_all(transaction.deref_mut())
        .await?;

        Ok(ratings)
    }

    /// Retrieves all ratings that user/admin has rated with all category ratings included
    ///
    /// # Arguments
    /// * `rater_id` - The ID of the rater
    /// * `transaction` - A mutable reference to the database transaction
    /// 
    /// # Returns
    /// Returns a `Result` containing either:
    /// * `Ok(Vec<RatingDetails>)` - All ratings from the rater
    /// * `Err(ChaosError)` - An error if retrieval fails
    pub async fn get_all_ratings_from_rater_id(
        rater_id: i64,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<Vec<RatingDetails>, ChaosError> {
        let ratings = sqlx::query_as!(
            RatingDetails,
            r#"
            SELECT ar.id, ar.rater_id, u.name as rater_name, ar.comment, ar.updated_at,
                COALESCE(jsonb_agg(jsonb_build_object('campaign_rating_category_id', arc.campaign_rating_category_id, 
                'category_name', crc.name,
                'rating', arc.rating)
                ) FILTER (WHERE arc.id IS NOT NULL),
                '[]'::jsonb
            ) as "category_ratings!: sqlx::types::Json<Vec<CategoryRatingDetail>>"
            FROM application_ratings ar
            JOIN users u ON u.id = ar.rater_id
            LEFT JOIN application_rating_category_ratings arc ON arc.application_rating_id = ar.id
            LEFT JOIN campaign_rating_categories crc ON crc.id = arc.campaign_rating_category_id
            WHERE ar.rater_id = $1
            GROUP BY ar.id, u.name
            "#,
            rater_id
        )
        .fetch_all(transaction.deref_mut())
        .await?;

        Ok(ratings)
    }

    /// ------------------- ApplicationCateogryRatings Operations ----------------
    
    /// Creates an ENTIRELY new application category rating in ApplicationCategoryRating WITH numerical rating score
    /// Ensures that the application category rating must be unique for application_rating_id and campaign_rating_category_id
    /// 
    /// # Arguments
    /// * `new_cateogory_rating` - The rating data to create
    /// * `application_rating_id` - The ID of the application rating being rated under ApplicationRating
    /// * `snowflake_generator` - A generator for creating unique IDs
    /// * `transaction` - A mutable reference to the database transaction
    /// 
    /// # Returns
    /// Returns a `Result` containing either:
    /// * `Ok(i64)` - The ID of the created application category rating
    /// * `Err(ChaosError)` - An error if creation fails
    pub async fn create_category_rating(
        new_category_rating: NewApplicationCategoryRating,
        application_rating_id: i64,
        snowflake_generator: &mut SnowflakeIdGenerator,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<i64, ChaosError> {
        let category_rating_id = snowflake_generator.real_time_generate();

        sqlx::query!(
            "
            INSERT INTO application_rating_category_ratings 
                (id, application_rating_id, campaign_rating_category_id, rating)
                VALUES ($1, $2, $3, $4)
            ",
            category_rating_id,
            application_rating_id,
            new_category_rating.campaign_rating_category_id,
            new_category_rating.rating
        )
        .execute(transaction.deref_mut())
        .await?;

        Ok(category_rating_id)
    }

    /// Updates an existing category application rating.
    /// 
    /// # Arguments
    /// * `category_rating_id` - The ID of the category rating to update
    /// * `updated_rating` - The new rating data
    /// * `transaction` - A mutable reference to the database transaction
    /// 
    /// # Returns
    /// Returns a `Result` containing either:
    /// * `Ok(())` - If the rating was updated successfully
    /// * `Err(ChaosError)` - An error if update fails
    pub async fn update_category_rating(
        category_rating_id: i64,
        updated_rating: i32,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<(), ChaosError> {
        let current_time = Utc::now();

        let _ = sqlx::query!(
            "
            UPDATE application_rating_category_ratings
            SET rating = $2, updated_at = $3
            WHERE id = $1
            RETURNING id
        ",
            category_rating_id,
            updated_rating,
            current_time
        )
        .fetch_one(transaction.deref_mut())
        .await?;

        Ok(())
    }
    
    // Gets all category ratings for an application rating ID, from application_ratrings
    /// 
    /// # Arguments
    /// * `application_rating_id` - The ID of the application rating to get all category ratings for
    /// * `transaction` - A mutable reference to the database transaction
    /// 
    /// # Returns
    /// Returns a `Result` containing either:
    /// * `Ok(ApplicationRatings)` - All ratings for the application
    /// * `Err(ChaosError)` - An error if retrieval fails
    pub async fn get_all_category_ratings_from_application_rating_id(
        application_rating_id: i64,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<Vec<ApplicationCategoryRating>, ChaosError> {
        let category_ratings = sqlx::query_as!(
            ApplicationCategoryRating,
            "
            SELECT arc.id, arc.application_rating_id, arc.campaign_rating_category_id, arc.rating, arc.created_at, arc.updated_at
                FROM application_rating_category_ratings arc
                WHERE arc.application_rating_id = $1
        ",
        application_rating_id
        )
        .fetch_all(transaction.deref_mut())
        .await?;

        Ok(category_ratings)
    }

    /// Deletes an application category rating.
    /// 
    /// # Arguments
    /// * `application_category_rating_id` - The ID of the application category rating to delete
    /// * `transaction` - A mutable reference to the database transaction
    /// 
    /// # Returns
    /// Returns a `Result` containing either:
    /// * `Ok(())` - If the category rating was deleted successfully
    /// * `Err(ChaosError)` - An error if deletion fails
    pub async fn delete_category_rating(
        application_category_rating_id: i64,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<(), ChaosError> {
        let _ = sqlx::query!(
            "
            DELETE FROM application_rating_category_ratings WHERE id = $1
            RETURNING id
        ",
        application_category_rating_id
        )
        .fetch_one(transaction.deref_mut())
        .await?;

        Ok(())
    } 
}
