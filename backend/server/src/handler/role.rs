//! Role handler for the Chaos application.
//! 
//! This module provides HTTP request handlers for managing campaign roles, including:
//! - Retrieving role details
//! - Updating and deleting roles
//! - Managing role applications

use crate::models::app::AppState;
use crate::models::application::Application;
use crate::models::auth::{AuthUser, RoleAdmin};
use crate::models::error::ChaosError;
use crate::models::role::{Role, RoleUpdate};
use crate::models::transaction::DBTransaction;
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
        _user: AuthUser,
    ) -> Result<impl IntoResponse, ChaosError> {
        let role = Role::get(id, &mut transaction.tx).await?;

        transaction.tx.commit().await?;
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
        _admin: RoleAdmin,
    ) -> Result<impl IntoResponse, ChaosError> {
        Role::delete(id, &mut transaction.tx).await?;

        transaction.tx.commit().await?;
        Ok((StatusCode::OK, "Successfully deleted role"))
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
        _admin: RoleAdmin,
        Json(data): Json<RoleUpdate>,
    ) -> Result<impl IntoResponse, ChaosError> {
        Role::update(id, data, &mut transaction.tx).await?;

        transaction.tx.commit().await?;
        Ok((StatusCode::OK, "Successfully updated role"))
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
        _admin: RoleAdmin,
        mut transaction: DBTransaction<'_>,
    ) -> Result<impl IntoResponse, ChaosError> {
        let applications = Application::get_from_role_id(id, &mut transaction.tx).await?;
        transaction.tx.commit().await?;
        Ok((StatusCode::OK, Json(applications)))
    }
}
