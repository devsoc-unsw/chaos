//! Answer handler for the Chaos application.
//! 
//! This module provides HTTP request handlers for managing application answers, including:
//! - Creating and retrieving answers
//! - Updating and deleting answers
//! - Managing role-specific answers

use crate::models::answer::{Answer, NewAnswer};
use crate::models::app::AppState;
use crate::models::auth::{AnswerOwner, ApplicationOwner};
use crate::models::error::ChaosError;
use crate::models::transaction::DBTransaction;
use axum::extract::{Json, Path, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;
use serde_json::json;
use crate::models::application::{OpenApplicationByAnswerId, OpenApplicationByApplicationId};

/// Handler for answer-related HTTP requests.
pub struct AnswerHandler;

impl AnswerHandler {
    /// Creates a new answer for an application.
    /// 
    /// This handler allows application owners to create answers for their application.
    /// The application must be open and not already submitted.
    /// 
    /// # Arguments
    /// 
    /// * `state` - The application state
    /// * `application_id` - The ID of the application
    /// * `_user` - The authenticated user (must be the application owner)
    /// * `_` - Ensures the application is open
    /// * `transaction` - Database transaction
    /// * `data` - The answer details
    /// 
    /// # Returns
    /// 
    /// * `Result<impl IntoResponse, ChaosError>` - Created answer ID or error
    pub async fn create(
        State(mut state): State<AppState>,
        Path(application_id): Path<i64>,
        _user: ApplicationOwner,
        _: OpenApplicationByApplicationId,
        mut transaction: DBTransaction<'_>,
        Json(data): Json<NewAnswer>,
    ) -> Result<impl IntoResponse, ChaosError> {
        // TODO: Check whether the question is contained in the campaign being applied to
        let id = Answer::create(
            application_id,
            data.question_id,
            data.data,
            &mut state.snowflake_generator,
            &mut transaction.tx,
        )
        .await?;

        transaction.tx.commit().await?;

        Ok((StatusCode::OK, Json(json!({"id": id}))))
    }

    /// Retrieves all common answers for an application.
    /// 
    /// This handler allows application owners to view all common answers.
    /// 
    /// # Arguments
    /// 
    /// * `application_id` - The ID of the application
    /// * `_owner` - The authenticated user (must be the application owner)
    /// * `transaction` - Database transaction
    /// 
    /// # Returns
    /// 
    /// * `Result<impl IntoResponse, ChaosError>` - List of answers or error
    pub async fn get_all_common_by_application(
        Path(application_id): Path<i64>,
        _owner: ApplicationOwner,
        mut transaction: DBTransaction<'_>,
    ) -> Result<impl IntoResponse, ChaosError> {
        let answers =
            Answer::get_all_common_by_application(application_id, &mut transaction.tx).await?;

        transaction.tx.commit().await?;

        Ok((StatusCode::OK, Json(answers)))
    }

    /// Retrieves all answers for a specific role in an application.
    /// 
    /// This handler allows application owners to view role-specific answers.
    /// 
    /// # Arguments
    /// 
    /// * `application_id` - The ID of the application
    /// * `role_id` - The ID of the role
    /// * `_owner` - The authenticated user (must be the application owner)
    /// * `transaction` - Database transaction
    /// 
    /// # Returns
    /// 
    /// * `Result<impl IntoResponse, ChaosError>` - List of answers or error
    pub async fn get_all_by_application_and_role(
        Path((application_id, role_id)): Path<(i64, i64)>,
        _owner: ApplicationOwner,
        mut transaction: DBTransaction<'_>,
    ) -> Result<impl IntoResponse, ChaosError> {
        let answers =
            Answer::get_all_by_application_and_role(application_id, role_id, &mut transaction.tx)
                .await?;

        transaction.tx.commit().await?;

        Ok((StatusCode::OK, Json(answers)))
    }

    /// Updates an existing answer.
    /// 
    /// This handler allows answer owners to update their answers.
    /// The application must be open and not already submitted.
    /// 
    /// # Arguments
    /// 
    /// * `answer_id` - The ID of the answer to update
    /// * `_owner` - The authenticated user (must be the answer owner)
    /// * `_` - Ensures the application is open
    /// * `transaction` - Database transaction
    /// * `data` - The new answer details
    /// 
    /// # Returns
    /// 
    /// * `Result<impl IntoResponse, ChaosError>` - Success message or error
    pub async fn update(
        Path(answer_id): Path<i64>,
        _owner: AnswerOwner,
        _: OpenApplicationByAnswerId, // Troublesome throws BadRequest
        mut transaction: DBTransaction<'_>,
        Json(new_answer): Json<NewAnswer>,
    ) -> Result<impl IntoResponse, ChaosError> {
        Answer::update(answer_id, new_answer.data, &mut transaction.tx).await?;

        transaction.tx.commit().await?;

        Ok((StatusCode::OK, "Successfully updated answer"))
    }

    /// Deletes an answer.
    /// 
    /// This handler allows answer owners to delete their answers.
    /// The application must be open and not already submitted.
    /// 
    /// # Arguments
    /// 
    /// * `answer_id` - The ID of the answer to delete
    /// * `_owner` - The authenticated user (must be the answer owner)
    /// * `_` - Ensures the application is open
    /// * `transaction` - Database transaction
    /// 
    /// # Returns
    /// 
    /// * `Result<impl IntoResponse, ChaosError>` - Success message or error
    pub async fn delete(
        Path(answer_id): Path<i64>,
        _owner: AnswerOwner,
        _: OpenApplicationByAnswerId,
        mut transaction: DBTransaction<'_>,
    ) -> Result<impl IntoResponse, ChaosError> {
        Answer::delete(answer_id, &mut transaction.tx).await?;

        transaction.tx.commit().await?;

        Ok((StatusCode::OK, "Successfully deleted answer"))
    }
}
