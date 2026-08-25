//! Application handler for the Chaos application.
//!
//! This module provides HTTP request handlers for managing applications, including:
//! - Creating and retrieving applications
//! - Updating application status and roles
//! - Submitting applications
//! - Managing application ratings

use crate::models::answer::Answer;
use crate::models::app::{AppMessage, AppState};
use crate::models::application::{
    Application, ApplicationRoleUpdate, ApplicationStatus, OpenApplicationByApplicationId,
};
use crate::models::error::ChaosError;
use crate::models::question::{Question, QuestionWithAnswer};
use crate::models::rating::{NewRating, Rating};
use crate::models::transaction::DBTransaction;
use crate::spicedb;
use crate::spicedb::{
    policies::{EditApplication, ReviewApplication, ReviewCampaign, UsePlatform, ViewApplication},
    schema as spicedb_schema, SpiceDbAuth,
};
use axum::extract::{Json, Path, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;
use serde_json::json;

/// Handler for application-related HTTP requests.
pub struct ApplicationHandler;

impl ApplicationHandler {
    /// Creates a new application if it doesn't exist, otherwise returns the existing application ID.
    ///
    /// # Arguments
    ///
    /// * `campaign_id` - ID of the campaign to apply to
    /// * `user_id` - ID of the user submitting the application
    /// * `snowflake_generator` - Generator for creating unique IDs
    /// * `transaction` - Database transaction to use
    ///
    /// # Returns
    ///
    /// * `Result<impl IntoResponse, ChaosError>` - Application details or error
    pub async fn create_or_get(
        Path(campaign_id): Path<i64>,
        auth: SpiceDbAuth<UsePlatform>,
        State(mut state): State<AppState>,
        mut transaction: DBTransaction<'_>,
    ) -> Result<impl IntoResponse, ChaosError> {
        let (application_id, created) = Application::create_or_get(
            campaign_id,
            auth.user_id,
            &mut state.snowflake_generator,
            &mut transaction.tx,
        )
        .await?;

        if created {
            transaction.create_spicedb_relationship(
                spicedb_schema::resource::APPLICATION,
                application_id,
                spicedb_schema::relation::application::CAMPAIGN,
                spicedb_schema::resource::CAMPAIGN,
                campaign_id,
            );

            transaction.create_spicedb_relationship(
                spicedb_schema::resource::APPLICATION,
                application_id,
                spicedb_schema::relation::application::CREATOR,
                spicedb_schema::resource::USER,
                auth.user_id,
            );
        }

        transaction.commit().await?;

        Ok(Json(
            json!({ "application_id": application_id.to_string() }),
        ))
    }

    /// Checks if an application exists for a given campaign and user.
    ///
    /// # Arguments
    ///
    /// * `campaign_id` - ID of the campaign to check
    /// * `user` - The authenticated user
    /// * `transaction` - Database transaction
    ///
    /// # Returns
    ///
    /// * `Result<impl IntoResponse, ChaosError>` - True if application exists, false otherwise
    pub async fn check_application_exists(
        Path(campaign_id): Path<i64>,
        auth: SpiceDbAuth<UsePlatform>,
        mut transaction: DBTransaction<'_>,
    ) -> Result<impl IntoResponse, ChaosError> {
        let application_exists =
            Application::check_application_exists(campaign_id, auth.user_id, &mut transaction.tx)
                .await?;

        transaction.commit().await?;
        Ok(Json(json!({ "application_exists": application_exists })))
    }

    /// Retrieves the details of a specific application.
    ///
    /// This handler allows application admins to view application details.
    ///
    /// # Arguments
    ///
    /// * `application_id` - The ID of the application to retrieve
    /// * `_admin` - The authenticated user (must be an application admin)
    /// * `transaction` - Database transaction
    ///
    /// # Returns
    ///
    /// * `Result<impl IntoResponse, ChaosError>` - Application details or error
    pub async fn get(
        Path(application_id): Path<i64>,
        auth: SpiceDbAuth<ReviewApplication>,
        mut transaction: DBTransaction<'_>,
    ) -> Result<impl IntoResponse, ChaosError> {
        let application =
            Application::get(application_id, auth.user_id, &mut transaction.tx).await?;
        transaction.commit().await?;
        Ok((StatusCode::OK, Json(application)))
    }

    /// Retrieves the details of a specific application regardless of submission status.
    ///
    /// This handler allows regular applicants to view application details in the answer screen.
    ///
    /// # Arguments
    ///
    /// * `application_id` - The ID of the application to retrieve
    /// * `_admin` - The authenticated user (must be an application admin)
    /// * `transaction` - Database transaction
    ///
    /// # Returns
    ///
    /// * `Result<impl IntoResponse, ChaosError>` - Application details or error
    pub async fn get_in_progress(
        Path(application_id): Path<i64>,
        auth: SpiceDbAuth<EditApplication>,
        mut transaction: DBTransaction<'_>,
    ) -> Result<impl IntoResponse, ChaosError> {
        let application =
            Application::get_in_progress(application_id, auth.user_id, &mut transaction.tx).await?;
        transaction.commit().await?;
        Ok(Json(application))
    }

    /// Updates the status of an application.
    ///
    /// This handler allows application admins to update the application's status.
    ///
    /// # Arguments
    ///
    /// * `state` - The application state
    /// * `application_id` - The ID of the application to update
    /// * `_admin` - The authenticated user (must be an application admin)
    /// * `data` - The new application status
    ///
    /// # Returns
    ///
    /// * `Result<impl IntoResponse, ChaosError>` - Success message or error
    pub async fn set_status(
        Path(application_id): Path<i64>,
        _auth: SpiceDbAuth<ReviewApplication>,
        mut transaction: DBTransaction<'_>,
        Json(data): Json<ApplicationStatus>,
    ) -> Result<impl IntoResponse, ChaosError> {
        Application::set_status(application_id, data, &mut transaction.tx).await?;
        transaction.commit().await?;
        Ok(AppMessage::OkMessage("Status successfully updated"))
    }

    /// Updates the private status of an application.
    ///
    /// This handler allows application admins to update the application's private status.
    ///
    /// # Arguments
    ///
    /// * `state` - The application state
    /// * `application_id` - The ID of the application to update
    /// * `_admin` - The authenticated user (must be an application admin)
    /// * `data` - The new private status
    ///
    /// # Returns
    ///
    /// * `Result<impl IntoResponse, ChaosError>` - Success message or error
    pub async fn set_private_status(
        Path(application_id): Path<i64>,
        _auth: SpiceDbAuth<ReviewApplication>,
        mut transaction: DBTransaction<'_>,
        Json(data): Json<ApplicationStatus>,
    ) -> Result<impl IntoResponse, ChaosError> {
        Application::set_private_status(application_id, data, &mut transaction.tx).await?;
        transaction.commit().await?;
        Ok(AppMessage::OkMessage("Private Status successfully updated"))
    }

    /// Retrieves all applications for the current user.
    ///
    /// This handler returns all applications created by the authenticated user.
    ///
    /// # Arguments
    ///
    /// * `user` - The authenticated user
    /// * `transaction` - Database transaction
    ///
    /// # Returns
    ///
    /// * `Result<impl IntoResponse, ChaosError>` - List of applications or error
    pub async fn get_from_curr_user(
        auth: SpiceDbAuth<UsePlatform>,
        mut transaction: DBTransaction<'_>,
    ) -> Result<impl IntoResponse, ChaosError> {
        let applications =
            Application::get_from_user_id(auth.user_id, auth.user_id, &mut transaction.tx).await?;
        transaction.commit().await?;
        Ok(Json(applications))
    }

    /// Retrieves all roles associated with a specific application.
    ///
    /// This handler allows application owners to view all roles they have applied for
    /// in a specific application, including their preference percentages.
    ///
    /// # Arguments
    ///
    /// * `_user` - The authenticated user (must be the application owner)
    /// * `application_id` - The ID of the application to retrieve roles for
    /// * `transaction` - Database transaction
    ///
    /// # Returns
    ///
    /// * `Result<impl IntoResponse, ChaosError>` - List of application roles with preferences or error
    pub async fn get_roles(
        _auth: SpiceDbAuth<ViewApplication>,
        Path(application_id): Path<i64>,
        mut transaction: DBTransaction<'_>,
    ) -> Result<impl IntoResponse, ChaosError> {
        let roles = Application::get_roles(application_id, &mut transaction.tx).await?;
        transaction.commit().await?;

        Ok(Json(roles))
    }

    /// Updates the roles associated with an application.
    ///
    /// This handler allows application owners to update the roles they're applying for.
    ///
    /// # Arguments
    ///
    /// * `_user` - The authenticated user (must be the application owner)
    /// * `application_id` - The ID of the application to update
    /// * `transaction` - Database transaction
    /// * `data` - The new role assignments
    ///
    /// # Returns
    ///
    /// * `Result<impl IntoResponse, ChaosError>` - Success message or error
    pub async fn update_roles(
        _auth: SpiceDbAuth<EditApplication>,
        _: OpenApplicationByApplicationId,
        Path(application_id): Path<i64>,
        mut transaction: DBTransaction<'_>,
        Json(data): Json<ApplicationRoleUpdate>,
    ) -> Result<impl IntoResponse, ChaosError> {
        Application::update_roles(application_id, data.roles, &mut transaction.tx).await?;
        transaction.commit().await?;
        Ok(AppMessage::OkMessage(
            "Successfully updated application roles",
        ))
    }

    /// Submits an application for review.
    ///
    /// This handler allows application owners to submit their application.
    /// The application must be open and not already submitted.
    ///
    /// # Arguments
    ///
    /// * `_user` - The authenticated user (must be the application owner)
    /// * `_` - Ensures the application is open
    /// * `application_id` - The ID of the application to submit
    /// * `transaction` - Database transaction
    ///
    /// # Returns
    ///
    /// * `Result<impl IntoResponse, ChaosError>` - Success message or error
    pub async fn submit(
        _auth: SpiceDbAuth<EditApplication>,
        _: OpenApplicationByApplicationId,
        Path(application_id): Path<i64>,
        mut transaction: DBTransaction<'_>,
    ) -> Result<impl IntoResponse, ChaosError> {
        Application::submit(application_id, &mut transaction.tx).await?;
        transaction.commit().await?;
        Ok(AppMessage::OkMessage("Successfully submitted application"))
    }

    /// Retrieves the rating for an application given by the current user.
    ///
    /// This handler allows application reviewers to view their rating for an application.
    ///
    /// # Arguments
    ///
    /// * `application_id` - The ID of the application to get the rating for
    /// * `admin` - The authenticated user (must be an application reviewer)
    /// * `transaction` - Database transaction
    ///
    /// # Returns
    ///
    /// * `Result<impl IntoResponse, ChaosError>` - Rating details with all category scores or error
    pub async fn get_rating_by_current_user(
        Path(application_id): Path<i64>,
        auth: SpiceDbAuth<ReviewApplication>,
        mut transaction: DBTransaction<'_>,
    ) -> Result<impl IntoResponse, ChaosError> {
        let rating =
            Rating::get_rating_details(application_id, auth.user_id, &mut transaction.tx).await?;
        transaction.commit().await?;
        Ok((StatusCode::OK, Json(rating)))
    }

    /// Creates a new rating for an application with comment and category scores.
    ///
    /// This handler allows application reviewers to create ratings.
    /// First creates the application_rating with comment, then creates all category ratings.
    ///
    /// # Arguments
    ///
    /// * `state` - The application state
    /// * `application_id` - The ID of the application to rate
    /// * `admin` - The authenticated user (must be an application reviewer)
    /// * `transaction` - Database transaction
    /// * `new_rating` - The rating details including comment and category scores
    ///
    /// # Returns
    ///
    /// * `Result<impl IntoResponse, ChaosError>` - Success message or error
    pub async fn create_rating(
        State(mut state): State<AppState>,
        Path(application_id): Path<i64>,
        auth: SpiceDbAuth<ReviewApplication>,
        mut transaction: DBTransaction<'_>,
        Json(new_rating): Json<NewRating>,
    ) -> Result<impl IntoResponse, ChaosError> {
        // First create the application_rating with comment
        let application_rating_id = Rating::create_application_rating(
            new_rating.comment,
            application_id,
            auth.user_id,
            &mut state.snowflake_generator,
            &mut transaction.tx,
        )
        .await?;

        transaction.create_spicedb_relationship(
            spicedb_schema::resource::RATING,
            application_id,
            spicedb_schema::relation::rating::APPLICATION,
            spicedb_schema::resource::APPLICATION,
            auth.resource_id,
        );

        transaction.create_spicedb_relationship(
            spicedb_schema::resource::RATING,
            application_id,
            spicedb_schema::relation::rating::CREATOR,
            spicedb_schema::resource::USER,
            auth.user_id,
        );

        // Then loop through and create each category rating
        for category_rating in new_rating.category_ratings {
            Rating::create_category_rating(
                category_rating,
                application_rating_id,
                &mut state.snowflake_generator,
                &mut transaction.tx,
            )
            .await?;

            transaction.create_spicedb_relationship(
                spicedb_schema::resource::CATEGORY_RATING,
                application_id,
                spicedb_schema::relation::category_rating::RATING,
                spicedb_schema::resource::RATING,
                application_rating_id,
            );
        }

        transaction.commit().await?;
        Ok(AppMessage::OkMessage("Successfully created rating"))
    }

    pub async fn update_rating(
        State(mut state): State<AppState>,
        Path(application_id): Path<i64>,
        auth: SpiceDbAuth<ReviewApplication>,
        mut transaction: DBTransaction<'_>,
        Json(updated_rating): Json<NewRating>,
    ) -> Result<impl IntoResponse, ChaosError> {
        // Get the existing rating for this user and application
        let rating =
            Rating::get_rating_details(application_id, auth.user_id, &mut transaction.tx).await?;

        // Update the comment
        Rating::update_application_rating(rating.id, updated_rating.comment, &mut transaction.tx)
            .await?;

        // Get existing category ratings and delete them
        let existing_category_ratings =
            Rating::get_all_category_ratings_from_application_rating_id(
                rating.id,
                &mut transaction.tx,
            )
            .await?;

        for category_rating in existing_category_ratings.clone() {
            Rating::delete_category_rating(category_rating.id, &mut transaction.tx).await?;
        }

        // Create new category ratings
        for category_rating in updated_rating.category_ratings {
            Rating::create_category_rating(
                category_rating,
                rating.id,
                &mut state.snowflake_generator,
                &mut transaction.tx,
            )
            .await?;

            transaction.create_spicedb_relationship(
                spicedb_schema::resource::CATEGORY_RATING,
                application_id,
                spicedb_schema::relation::category_rating::RATING,
                spicedb_schema::resource::RATING,
                rating.id,
            );
        }

        transaction.commit().await?;

        // Run deletes after Postgres transaction successfully commits
        for category_rating in existing_category_ratings {
            spicedb::delete_all_resource_relationships(
                &state.spicedb,
                &state.spicedb_key,
                crate::spicedb::schema::resource::CATEGORY_RATING,
                category_rating.id,
            )
            .await?;
        }
        Ok(AppMessage::OkMessage("Successfully updated rating"))
    }

    /// Retrieves all ratings for an application.
    ///
    /// This handler allows application reviewers to view all ratings for an application.
    ///
    /// # Arguments
    ///
    /// * `application_id` - The ID of the application
    /// * `_admin` - The authenticated user (must be an application reviewer)
    /// * `transaction` - Database transaction
    ///
    /// # Returns
    ///
    /// * `Result<impl IntoResponse, ChaosError>` - List of ratings with all category scores or error
    pub async fn get_ratings(
        Path(application_id): Path<i64>,
        _auth: SpiceDbAuth<ReviewApplication>,
        mut transaction: DBTransaction<'_>,
    ) -> Result<impl IntoResponse, ChaosError> {
        let ratings =
            Rating::get_all_ratings_from_application_id(application_id, &mut transaction.tx)
                .await?;
        transaction.commit().await?;
        Ok((StatusCode::OK, Json(ratings)))
    }

    /// Retrieves the average ratings for all users in an application.
    ///
    /// This handler allows application reviewers to view the average ratings for all users in an application.
    ///
    /// # Arguments
    ///
    /// * `_user` - The authenticated user (must be an application reviewer)
    /// * `application_id` - The ID of the application
    /// * `transaction` - Database transaction
    ///
    /// # Returns
    ///
    /// * `Result<impl IntoResponse, ChaosError>` - List of average ratings or error
    pub async fn get_application_ratings_summary(
        _auth: SpiceDbAuth<ReviewCampaign>,
        Path(campaign_id): Path<i64>,
        mut transaction: DBTransaction<'_>,
    ) -> Result<impl IntoResponse, ChaosError> {
        let avg_applications_ratings =
            Application::get_application_ratings_summary(campaign_id, &mut transaction.tx).await?;
        transaction.commit().await?;

        Ok(Json(avg_applications_ratings))
    }

    /// Retrieves all questions and answers for an application in one call.
    ///
    /// This handler allows the application owner or a reviewer to view the
    /// common questions and the questions for each applied role, each with
    /// its answer nested inside (or `null` if unanswered).
    ///
    /// # Arguments
    ///
    /// * `application_id` - The ID of the application
    /// * `_user` - The authenticated user (must be the application owner or a reviewer)
    /// * `transaction` - Database transaction
    ///
    /// # Returns
    ///
    /// * `Result<impl IntoResponse, ChaosError>` - List of questions with nested answers or error
    pub async fn get_questions_and_answers(
        Path(application_id): Path<i64>,
        _auth: SpiceDbAuth<ViewApplication>,
        mut transaction: DBTransaction<'_>,
    ) -> Result<impl IntoResponse, ChaosError> {
        let questions =
            Question::get_all_for_application(application_id, &mut transaction.tx).await?;
        let answers = Answer::get_all_by_application(application_id, &mut transaction.tx).await?;
        transaction.commit().await?;

        Ok((
            StatusCode::OK,
            Json(QuestionWithAnswer::merge(questions, answers)),
        ))
    }
}
