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
    /// * `auth` - The authenticated user, authorized to use the platform
    /// * `state` - The application state
    /// * `transaction` - Database transaction to use
    ///
    /// # Returns
    ///
    /// * `Result<impl IntoResponse, ChaosError>` - JSON containing the application ID or error
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
    /// * `auth` - The authenticated user, authorized to use the platform (`SpiceDbAuth<UsePlatform>`)
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
    /// This handler allows application reviewers to view application details.
    ///
    /// # Arguments
    ///
    /// * `application_id` - The ID of the application to retrieve
    /// * `auth` - The authenticated reviewer, authorized by `SpiceDbAuth<ReviewApplication>`
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
    /// * `auth` - The authenticated applicant, authorized by `SpiceDbAuth<EditApplication>`
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
    /// This handler allows application reviewers to update the application's status.
    ///
    /// # Arguments
    ///
    /// * `application_id` - The ID of the application to update
    /// * `_auth` - The authenticated reviewer, authorized by `SpiceDbAuth<ReviewApplication>`
    /// * `transaction` - Database transaction
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
    /// This handler allows application reviewers to update the application's private status.
    ///
    /// # Arguments
    ///
    /// * `application_id` - The ID of the application to update
    /// * `_auth` - The authenticated reviewer, authorized by `SpiceDbAuth<ReviewApplication>`
    /// * `transaction` - Database transaction
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
    /// * `auth` - The authenticated user, authorized to use the platform (`SpiceDbAuth<UsePlatform>`)
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
    /// This handler allows application creators and reviewers to view
    /// all roles an applicant has applied for including their
    /// preference percentages.
    ///
    /// # Arguments
    ///
    /// * `_auth` - The authenticated user, authorized by `SpiceDbAuth<ViewApplication>`
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
    /// * `_auth` - The authenticated user, authorized by `SpiceDbAuth<EditApplication>`
    /// * `_: OpenApplicationByApplicationId` - Ensures the application is open
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
    /// * `_auth` - The authenticated user, authorized by `SpiceDbAuth<EditApplication>`
    /// * `_: OpenApplicationByApplicationId` - Ensures the application is open
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

    /// Retrieves the average ratings for all users in an application.
    ///
    /// This handler allows campaign reviewers to view the average ratings for all
    /// applications in the campaign.
    ///
    /// # Arguments
    ///
    /// * `_auth` - The authenticated reviewer, authorized by `SpiceDbAuth<ReviewCampaign>`
    /// * `campaign_id` - The ID of the campaign
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
    /// * `_auth` - The authenticated user, authorized by `SpiceDbAuth<ViewApplication>`
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
