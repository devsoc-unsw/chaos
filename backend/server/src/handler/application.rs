//! Application handler for the Chaos application.
//! 
//! This module provides HTTP request handlers for managing applications, including:
//! - Creating and retrieving applications
//! - Updating application status and roles
//! - Submitting applications
//! - Managing application ratings

use crate::models::app::AppState;
use crate::models::application::{Application, ApplicationRoleUpdate, ApplicationStatus, OpenApplicationByApplicationId};
use crate::models::auth::{ApplicationAdmin, ApplicationOwner, ApplicationReviewerGivenApplicationId, AuthUser};
use crate::models::error::ChaosError;
use crate::models::transaction::DBTransaction;
use axum::extract::{Json, Path, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;
use crate::models::rating::{NewRating, Rating};

/// Handler for application-related HTTP requests.
pub struct ApplicationHandler;

impl ApplicationHandler {
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
        _admin: ApplicationAdmin,
        mut transaction: DBTransaction<'_>,
    ) -> Result<impl IntoResponse, ChaosError> {
        let application = Application::get(application_id, &mut transaction.tx).await?;
        transaction.tx.commit().await?;
        Ok((StatusCode::OK, Json(application)))
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
        _admin: ApplicationAdmin,
        mut transaction: DBTransaction<'_>,
        Json(data): Json<ApplicationStatus>,
    ) -> Result<impl IntoResponse, ChaosError> {
        Application::set_status(application_id, data, &mut transaction.tx).await?;
        transaction.tx.commit().await?;
        Ok((StatusCode::OK, "Status successfully updated"))
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
        _admin: ApplicationAdmin,
        mut transaction: DBTransaction<'_>,
        Json(data): Json<ApplicationStatus>,
    ) -> Result<impl IntoResponse, ChaosError> {
        Application::set_private_status(application_id, data, &mut transaction.tx).await?;
        transaction.tx.commit().await?;
        Ok((StatusCode::OK, "Private Status successfully updated"))
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
        user: AuthUser,
        mut transaction: DBTransaction<'_>,
    ) -> Result<impl IntoResponse, ChaosError> {
        let applications = Application::get_from_user_id(user.user_id, &mut transaction.tx).await?;
        transaction.tx.commit().await?;
        Ok((StatusCode::OK, Json(applications)))
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
        _user: ApplicationOwner,
        Path(application_id): Path<i64>,
        mut transaction: DBTransaction<'_>,
        Json(data): Json<ApplicationRoleUpdate>,
    ) -> Result<impl IntoResponse, ChaosError> {
        Application::update_roles(application_id, data.roles, &mut transaction.tx).await?;
        transaction.tx.commit().await?;
        Ok((StatusCode::OK, "Successfully updated application roles"))
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
        _user: ApplicationOwner,
        _: OpenApplicationByApplicationId,
        Path(application_id): Path<i64>,
        mut transaction: DBTransaction<'_>,
    ) -> Result<impl IntoResponse, ChaosError> {
        Application::submit(application_id, &mut transaction.tx).await?;
        transaction.tx.commit().await?;
        Ok((StatusCode::OK, "Successfully submitted application"))
    }

    /// Creates a new rating for an application.
    /// 
    /// This handler allows application reviewers to create ratings.
    /// 
    /// # Arguments
    /// 
    /// * `state` - The application state
    /// * `application_id` - The ID of the application to rate
    /// * `admin` - The authenticated user (must be an application reviewer)
    /// * `transaction` - Database transaction
    /// * `new_rating` - The rating details
    /// 
    /// # Returns
    /// 
    /// * `Result<impl IntoResponse, ChaosError>` - Success message or error
    pub async fn create_rating(
        State(mut state): State<AppState>,
        Path(application_id): Path<i64>,
        admin: ApplicationReviewerGivenApplicationId,
        mut transaction: DBTransaction<'_>,
        Json(new_rating): Json<NewRating>,
    ) -> Result<impl IntoResponse, ChaosError> {
        Rating::create(
            new_rating,
            application_id,
            admin.user_id,
            &mut state.snowflake_generator,
            &mut transaction.tx,
        )
            .await?;
        transaction.tx.commit().await?;
        Ok((StatusCode::OK, "Successfully created rating"))
    }

    /// Retrieves all ratings for an application.
    /// 
    /// This handler allows application reviewers to view all ratings for an application.
    /// 
    /// # Arguments
    /// 
    /// * `_state` - The application state
    /// * `application_id` - The ID of the application
    /// * `_admin` - The authenticated user (must be an application reviewer)
    /// * `transaction` - Database transaction
    /// 
    /// # Returns
    /// 
    /// * `Result<impl IntoResponse, ChaosError>` - List of ratings or error
    pub async fn get_ratings(
        State(_state): State<AppState>,
        Path(application_id): Path<i64>,
        _admin: ApplicationReviewerGivenApplicationId,
        mut transaction: DBTransaction<'_>,
    ) -> Result<impl IntoResponse, ChaosError> {
        let ratings =
            Rating::get_all_ratings_from_application_id(application_id, &mut transaction.tx)
                .await?;
        transaction.tx.commit().await?;
        Ok((StatusCode::OK, Json(ratings)))
    }
}
