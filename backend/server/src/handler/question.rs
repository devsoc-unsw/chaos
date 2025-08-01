//! Question handler for the Chaos application.
//! 
//! This module provides HTTP request handlers for managing questions, including:
//! - Creating and retrieving questions
//! - Updating and deleting questions
//! - Managing role-specific and common questions

use crate::models::app::AppState;
use crate::models::auth::{AuthUser, CampaignAdmin, QuestionAdmin};
use crate::models::error::ChaosError;
use crate::models::question::{NewQuestion, Question};
use crate::models::transaction::DBTransaction;
use axum::extract::{Json, Path, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;
use serde_json::json;

/// Handler for question-related HTTP requests.
pub struct QuestionHandler;

impl QuestionHandler {
    /// Creates a new question for a campaign.
    /// 
    /// This handler allows campaign admins to create questions.
    /// 
    /// # Arguments
    /// 
    /// * `state` - The application state
    /// * `campaign_id` - The ID of the campaign
    /// * `_admin` - The authenticated user (must be a campaign admin)
    /// * `transaction` - Database transaction
    /// * `data` - The new question details
    /// 
    /// # Returns
    /// 
    /// * `Result<impl IntoResponse, ChaosError>` - Question ID or error
    pub async fn create(
        State(mut state): State<AppState>,
        Path(campaign_id): Path<i64>,
        _admin: CampaignAdmin,
        mut transaction: DBTransaction<'_>,
        Json(data): Json<NewQuestion>,
    ) -> Result<impl IntoResponse, ChaosError> {
        let id = Question::create(
            campaign_id,
            data.title,
            data.description,
            data.common,
            data.roles,
            data.required,
            data.question_data,
            &mut state.snowflake_generator,
            &mut transaction.tx,
        )
        .await?;

        transaction.tx.commit().await?;

        Ok((StatusCode::OK, Json(json!({"id": id}))))
    }

    /// Retrieves all questions for a specific role in a campaign.
    /// 
    /// This handler allows any authenticated user to view role-specific questions.
    /// 
    /// # Arguments
    /// 
    /// * `campaign_id` - The ID of the campaign
    /// * `role_id` - The ID of the role
    /// * `_user` - The authenticated user
    /// * `transaction` - Database transaction
    /// 
    /// # Returns
    /// 
    /// * `Result<impl IntoResponse, ChaosError>` - List of questions or error
    pub async fn get_all_by_campaign_and_role(
        Path((campaign_id, role_id)): Path<(i64, i64)>,
        _user: AuthUser,
        mut transaction: DBTransaction<'_>,
    ) -> Result<impl IntoResponse, ChaosError> {
        let questions =
            Question::get_all_by_campaign_and_role(campaign_id, role_id, &mut transaction.tx)
                .await?;

        transaction.tx.commit().await?;

        Ok((StatusCode::OK, Json(questions)))
    }

    /// Retrieves all common questions for a campaign.
    /// 
    /// This handler allows any authenticated user to view common questions.
    /// 
    /// # Arguments
    /// 
    /// * `campaign_id` - The ID of the campaign
    /// * `_user` - The authenticated user
    /// * `transaction` - Database transaction
    /// 
    /// # Returns
    /// 
    /// * `Result<impl IntoResponse, ChaosError>` - List of questions or error
    pub async fn get_all_common_by_campaign(
        Path(campaign_id): Path<i64>,
        _user: AuthUser,
        mut transaction: DBTransaction<'_>,
    ) -> Result<impl IntoResponse, ChaosError> {
        let questions =
            Question::get_all_common_by_campaign(campaign_id, &mut transaction.tx).await?;

        transaction.tx.commit().await?;

        Ok((StatusCode::OK, Json(questions)))
    }

    /// Updates a question.
    /// 
    /// This handler allows question admins to update question details.
    /// 
    /// # Arguments
    /// 
    /// * `state` - The application state
    /// * `question_id` - The ID of the question to update
    /// * `_admin` - The authenticated user (must be a question admin)
    /// * `transaction` - Database transaction
    /// * `data` - The new question details
    /// 
    /// # Returns
    /// 
    /// * `Result<impl IntoResponse, ChaosError>` - Success message or error
    pub async fn update(
        State(mut state): State<AppState>,
        Path(question_id): Path<i64>,
        _admin: QuestionAdmin,
        mut transaction: DBTransaction<'_>,
        Json(data): Json<NewQuestion>,
    ) -> Result<impl IntoResponse, ChaosError> {
        Question::update(
            question_id,
            data.title,
            data.description,
            data.common,
            data.roles,
            data.required,
            data.question_data,
            &mut transaction.tx,
            &mut state.snowflake_generator,
        )
        .await?;

        transaction.tx.commit().await?;

        Ok((StatusCode::OK, "Successfully updated question"))
    }

    /// Deletes a question.
    /// 
    /// This handler allows question admins to delete questions.
    /// 
    /// # Arguments
    /// 
    /// * `question_id` - The ID of the question to delete
    /// * `_admin` - The authenticated user (must be a question admin)
    /// * `transaction` - Database transaction
    /// 
    /// # Returns
    /// 
    /// * `Result<impl IntoResponse, ChaosError>` - Success message or error
    pub async fn delete(
        Path(question_id): Path<i64>,
        _admin: QuestionAdmin,
        mut transaction: DBTransaction<'_>,
    ) -> Result<impl IntoResponse, ChaosError> {
        Question::delete(question_id, &mut transaction.tx).await?;

        transaction.tx.commit().await?;

        Ok((StatusCode::OK, "Successfully deleted question"))
    }
}
