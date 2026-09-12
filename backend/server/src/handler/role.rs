//! Role handler for the Chaos application.
//!
//! This module provides HTTP request handlers for managing campaign roles, including:
//! - Retrieving role details
//! - Updating and deleting roles
//! - Managing role applications

use crate::models::app::{AppMessage, AppState};
use crate::models::application::Application;
use crate::models::error::ChaosError;
use crate::models::role::{Role, RoleUpdate};
use crate::models::transaction::DBTransaction;
use crate::spicedb::{
    self,
    policies::{ManageCampaignRole, UsePlatform},
    schema as spicedb_schema, SpiceDbAuth,
};
use axum::extract::{Json, Path, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;

/// Handler for role-related HTTP requests.
pub struct RoleHandler;

impl RoleHandler {
    /// Retrieves the details of a specific role.
    ///
    /// This handler allows any authenticated user to view role details.
    ///
    /// # Arguments
    ///
    /// * `state` - The application state
    /// * `id` - The ID of the role to retrieve
    /// * `_user` - The authenticated user
    ///
    /// # Returns
    ///
    /// * `Result<impl IntoResponse, ChaosError>` - Role details or error
    pub async fn get(
        mut transaction: DBTransaction<'_>,
        Path(id): Path<i64>,
        _auth: SpiceDbAuth<UsePlatform>,
    ) -> Result<impl IntoResponse, ChaosError> {
        let role = Role::get(id, &mut transaction.tx).await?;

        transaction.commit().await?;
        Ok((StatusCode::OK, Json(role)))
    }

    /// Deletes a role.
    ///
    /// This handler allows role admins to delete roles.
    ///
    /// # Arguments
    ///
    /// * `state` - The application state
    /// * `id` - The ID of the role to delete
    /// * `_admin` - The authenticated user (must be a role admin)
    ///
    /// # Returns
    ///
    /// * `Result<impl IntoResponse, ChaosError>` - Success message or error
    pub async fn delete(
        mut transaction: DBTransaction<'_>,
        Path(id): Path<i64>,
        _auth: SpiceDbAuth<ManageCampaignRole>,
        state: State<AppState>,
    ) -> Result<impl IntoResponse, ChaosError> {
        Role::delete(id, &mut transaction.tx).await?;

        transaction.commit().await?;

        // Run SpiceDB delete after Postgres succeeds
        spicedb::delete_all_resource_relationships(
            &state.spicedb,
            &state.spicedb_key,
            spicedb_schema::resource::CAMPAIGN_ROLE,
            id,
        )
        .await?;

        Ok(AppMessage::OkMessage("Successfully deleted role"))
    }

    /// Updates a role.
    ///
    /// This handler allows role admins to update role details.
    ///
    /// # Arguments
    ///
    /// * `state` - The application state
    /// * `id` - The ID of the role to update
    /// * `_admin` - The authenticated user (must be a role admin)
    /// * `data` - The new role details
    ///
    /// # Returns
    ///
    /// * `Result<impl IntoResponse, ChaosError>` - Success message or error
    pub async fn update(
        mut transaction: DBTransaction<'_>,
        Path(id): Path<i64>,
        _auth: SpiceDbAuth<ManageCampaignRole>,
        Json(data): Json<RoleUpdate>,
    ) -> Result<impl IntoResponse, ChaosError> {
        Role::update(id, data, &mut transaction.tx).await?;

        transaction.commit().await?;
        Ok(AppMessage::OkMessage("Successfully updated role"))
    }

    /// Retrieves all applications for a specific role.
    ///
    /// This handler allows role admins to view all applications for a role.
    ///
    /// # Arguments
    ///
    /// * `id` - The ID of the role
    /// * `_admin` - The authenticated user (must be a role admin)
    /// * `transaction` - Database transaction
    ///
    /// # Returns
    ///
    /// * `Result<impl IntoResponse, ChaosError>` - List of applications or error
    pub async fn get_applications(
        Path(id): Path<i64>,
        auth: SpiceDbAuth<ManageCampaignRole>,
        mut transaction: DBTransaction<'_>,
    ) -> Result<impl IntoResponse, ChaosError> {
        let applications =
            Application::get_from_role_id(id, auth.user_id, &mut transaction.tx).await?;
        transaction.commit().await?;
        Ok((StatusCode::OK, Json(applications)))
    }
}
