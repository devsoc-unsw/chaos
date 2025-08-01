//! Email template handler for the Chaos application.
//! 
//! This module provides HTTP request handlers for managing email templates, including:
//! - Retrieving template details
//! - Updating templates
//! - Deleting templates

use crate::models::app::AppState;
use crate::models::auth::EmailTemplateAdmin;
use crate::models::email_template::EmailTemplate;
use crate::models::error::ChaosError;
use crate::models::transaction::DBTransaction;
use axum::extract::{Json, Path, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;

/// Handler for email template-related HTTP requests.
pub struct EmailTemplateHandler;

impl EmailTemplateHandler {
    /// Retrieves the details of a specific email template.
    /// 
    /// This handler allows email template admins to view template details.
    /// 
    /// # Arguments
    /// 
    /// * `transaction` - Database transaction
    /// * `id` - The ID of the template to retrieve
    /// * `_user` - The authenticated user (must be an email template admin)
    /// 
    /// # Returns
    /// 
    /// * `Result<impl IntoResponse, ChaosError>` - Template details or error
    pub async fn get(
        mut transaction: DBTransaction<'_>,
        Path(id): Path<i64>,
        _user: EmailTemplateAdmin,
    ) -> Result<impl IntoResponse, ChaosError> {
        let email_template = EmailTemplate::get(id, &mut transaction.tx).await?;

        Ok((StatusCode::OK, Json(email_template)))
    }

    /// Updates an email template.
    /// 
    /// This handler allows email template admins to update template details.
    /// 
    /// # Arguments
    /// 
    /// * `_user` - The authenticated user (must be an email template admin)
    /// * `id` - The ID of the template to update
    /// * `state` - The application state
    /// * `request_body` - The new template details
    /// 
    /// # Returns
    /// 
    /// * `Result<impl IntoResponse, ChaosError>` - Success message or error
    pub async fn update(
        _user: EmailTemplateAdmin,
        Path(id): Path<i64>,
        mut transaction: DBTransaction<'_>,
        Json(request_body): Json<EmailTemplate>,
    ) -> Result<impl IntoResponse, ChaosError> {
        EmailTemplate::update(
            id,
            request_body.name,
            request_body.template_subject,
            request_body.template_body,
            &mut transaction.tx,
        )
        .await?;

        transaction.tx.commit().await?;
        Ok((StatusCode::OK, "Successfully updated email template"))
    }

    /// Deletes an email template.
    /// 
    /// This handler allows email template admins to delete templates.
    /// 
    /// # Arguments
    /// 
    /// * `_user` - The authenticated user (must be an email template admin)
    /// * `id` - The ID of the template to delete
    /// * `state` - The application state
    /// 
    /// # Returns
    /// 
    /// * `Result<impl IntoResponse, ChaosError>` - Success message or error
    pub async fn delete(
        _user: EmailTemplateAdmin,
        Path(id): Path<i64>,
        mut transaction: DBTransaction<'_>,
    ) -> Result<impl IntoResponse, ChaosError> {
        EmailTemplate::delete(id, &mut transaction.tx).await?;

        transaction.tx.commit().await?;
        Ok((StatusCode::OK, "Successfully delete email template"))
    }
}
