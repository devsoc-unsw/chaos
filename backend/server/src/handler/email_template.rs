//! Email template handler for the Chaos application.
//!
//! This module provides HTTP request handlers for managing email templates, including:
//! - Retrieving template details
//! - Updating templates
//! - Deleting templates

use crate::models::app::{AppMessage, AppState};
use crate::models::email_template::EmailTemplate;
use crate::models::error::ChaosError;
use crate::models::rating::Rating;
use crate::models::transaction::DBTransaction;
use crate::spicedb;
use crate::spicedb::{policies::ManageEmailTemplate, schema as spicedb_schema, SpiceDbAuth};
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
    /// * `auth` - The authenticated user, authorized by `SpiceDbAuth<ManageEmailTemplate>`
    ///   (template identified by the `template_id` path parameter)
    ///
    /// # Returns
    ///
    /// * `Result<impl IntoResponse, ChaosError>` - Template details or error
    pub async fn get(
        mut transaction: DBTransaction<'_>,
        auth: SpiceDbAuth<ManageEmailTemplate>,
    ) -> Result<impl IntoResponse, ChaosError> {
        let email_template = EmailTemplate::get(auth.resource_id, &mut transaction.tx).await?;

        Ok((StatusCode::OK, Json(email_template)))
    }

    /// Updates an email template.
    ///
    /// This handler allows email template admins to update template details.
    ///
    /// # Arguments
    ///
    /// * `auth` - The authenticated user, authorized by `SpiceDbAuth<ManageEmailTemplate>`
    ///   (template identified by the `template_id` path parameter)
    /// * `transaction` - Database transaction
    /// * `request_body` - The new template details
    ///
    /// # Returns
    ///
    /// * `Result<impl IntoResponse, ChaosError>` - Success message or error
    pub async fn update(
        auth: SpiceDbAuth<ManageEmailTemplate>,
        mut transaction: DBTransaction<'_>,
        Json(request_body): Json<EmailTemplate>,
    ) -> Result<impl IntoResponse, ChaosError> {
        EmailTemplate::update(
            auth.resource_id,
            request_body.name,
            request_body.template_subject,
            request_body.template_body,
            &mut transaction.tx,
        )
        .await?;

        transaction.commit().await?;
        Ok(AppMessage::OkMessage("Successfully updated email template"))
    }

    /// Deletes an email template.
    ///
    /// This handler allows email template admins to delete templates.
    ///
    /// # Arguments
    ///
    /// * `auth` - The authenticated user, authorized by `SpiceDbAuth<ManageEmailTemplate>`
    ///   (template identified by the `template_id` path parameter)
    /// * `state` - The application state
    /// * `transaction` - Database transaction
    ///
    /// # Returns
    ///
    /// * `Result<impl IntoResponse, ChaosError>` - Success message or error
    pub async fn delete(
        auth: SpiceDbAuth<ManageEmailTemplate>,
        State(state): State<AppState>,
        mut transaction: DBTransaction<'_>,
    ) -> Result<impl IntoResponse, ChaosError> {
        EmailTemplate::delete(auth.resource_id, &mut transaction.tx).await?;

        transaction.commit().await?;

        // Run SpiceDB delete after Postgres succeeds
        let new_zedtoken = spicedb::delete_all_resource_relationships(
            &state.spicedb,
            &state.spicedb_key,
            spicedb::schema::resource::EMAIL_TEMPLATE,
            auth.resource_id,
        )
        .await?;

        spicedb::store_zedtoken(&state.spicedb_zedtoken, new_zedtoken);

        Ok(AppMessage::OkMessage("Successfully deleted email template"))
    }

    /// Duplicates an email template.
    ///
    /// This handler allows email template admins to duplicate templates.
    ///
    /// # Arguments
    ///
    /// * `auth` - The authenticated user, authorized by `SpiceDbAuth<ManageEmailTemplate>`
    ///   (template identified by the `template_id` path parameter)
    /// * `state` - The application state
    /// * `transaction` - Database transaction
    ///
    /// # Returns
    ///
    /// * `Result<impl IntoResponse, ChaosError>` - Success message or error
    pub async fn duplicate(
        auth: SpiceDbAuth<ManageEmailTemplate>,
        State(mut state): State<AppState>,
        mut transaction: DBTransaction<'_>,
    ) -> Result<impl IntoResponse, ChaosError> {
        let (new_template_id, organisation_id) = EmailTemplate::duplicate(
            auth.resource_id,
            &mut transaction.tx,
            &mut state.snowflake_generator,
        )
        .await?;

        transaction.create_spicedb_relationship(
            spicedb_schema::resource::EMAIL_TEMPLATE,
            new_template_id,
            spicedb_schema::relation::email_template::ORGANISATION,
            spicedb_schema::resource::ORGANISATION,
            organisation_id,
        );

        transaction.commit().await?;
        Ok(AppMessage::OkMessage(
            "Successfully duplicated email template",
        ))
    }
}
