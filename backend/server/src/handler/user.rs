//! User handler for the Chaos application.
//! 
//! This module provides HTTP request handlers for managing user profiles, including:
//! - Retrieving user details
//! - Updating user information (name, pronouns, gender, zid, degree)

use crate::models::auth::{AuthUser, SuperUser};
use crate::models::error::ChaosError;
use crate::models::user::{User, UserDegree, UserGender, UserName, UserPronouns, UserRole, UserRoleUpdate, UserZid};
use axum::extract::Json;
use axum::http::StatusCode;
use axum::response::IntoResponse;
use crate::models::app::AppMessage;
use crate::models::transaction::DBTransaction;

/// Handler for user-related HTTP requests.
pub struct UserHandler;

impl UserHandler {
    /// Retrieves the details of the current user.
    /// 
    /// This handler allows authenticated users to view their profile details.
    /// 
    /// # Arguments
    /// 
    /// * `state` - The application state
    /// * `user` - The authenticated user
    /// 
    /// # Returns
    /// 
    /// * `Result<impl IntoResponse, ChaosError>` - User details or error
    pub async fn get(
        mut transaction: DBTransaction<'_>,
        user: AuthUser,
    ) -> Result<impl IntoResponse, ChaosError> {
        let user = User::get(user.user_id, &mut transaction.tx).await?;

        transaction.tx.commit().await?;
        Ok((StatusCode::OK, Json(user)))
    }

    /// Updates the user's name.
    /// 
    /// This handler allows users to update their name.
    /// 
    /// # Arguments
    /// 
    /// * `state` - The application state
    /// * `user` - The authenticated user
    /// * `request_body` - The new name
    /// 
    /// # Returns
    /// 
    /// * `Result<impl IntoResponse, ChaosError>` - Success message or error
    pub async fn update_name(
        mut transaction: DBTransaction<'_>,
        user: AuthUser,
        Json(request_body): Json<UserName>,
    ) -> Result<impl IntoResponse, ChaosError> {
        User::update_name(user.user_id, request_body.name, &mut transaction.tx).await?;

        transaction.tx.commit().await?;
        Ok(AppMessage::OkMessage("Updated username"))
    }

    /// Updates the user's pronouns.
    /// 
    /// This handler allows users to update their pronouns.
    /// 
    /// # Arguments
    /// 
    /// * `state` - The application state
    /// * `user` - The authenticated user
    /// * `request_body` - The new pronouns
    /// 
    /// # Returns
    /// 
    /// * `Result<impl IntoResponse, ChaosError>` - Success message or error
    pub async fn update_pronouns(
        mut transaction: DBTransaction<'_>,
        user: AuthUser,
        Json(request_body): Json<UserPronouns>,
    ) -> Result<impl IntoResponse, ChaosError> {
        User::update_pronouns(user.user_id, request_body.pronouns, &mut transaction.tx).await?;

        transaction.tx.commit().await?;
        Ok(AppMessage::OkMessage("Updated pronouns"))
    }

    /// Updates the user's gender.
    /// 
    /// This handler allows users to update their gender.
    /// 
    /// # Arguments
    /// 
    /// * `state` - The application state
    /// * `user` - The authenticated user
    /// * `request_body` - The new gender
    /// 
    /// # Returns
    /// 
    /// * `Result<impl IntoResponse, ChaosError>` - Success message or error
    pub async fn update_gender(
        mut transaction: DBTransaction<'_>,
        user: AuthUser,
        Json(request_body): Json<UserGender>,
    ) -> Result<impl IntoResponse, ChaosError> {
        User::update_gender(user.user_id, request_body.gender, &mut transaction.tx).await?;

        transaction.tx.commit().await?;
        Ok(AppMessage::OkMessage("Updated gender"))
    }

    /// Updates the user's zid.
    /// 
    /// This handler allows users to update their zid.
    /// 
    /// # Arguments
    /// 
    /// * `state` - The application state
    /// * `user` - The authenticated user
    /// * `request_body` - The new zid
    /// 
    /// # Returns
    /// 
    /// * `Result<impl IntoResponse, ChaosError>` - Success message or error
    pub async fn update_zid(
        mut transaction: DBTransaction<'_>,
        user: AuthUser,
        Json(request_body): Json<UserZid>,
    ) -> Result<impl IntoResponse, ChaosError> {
        User::update_zid(user.user_id, request_body.zid, &mut transaction.tx).await?;

        transaction.tx.commit().await?;
        Ok(AppMessage::OkMessage("Updated zid"))
    }

    /// Updates the user's degree information.
    /// 
    /// This handler allows users to update their degree details.
    /// 
    /// # Arguments
    /// 
    /// * `state` - The application state
    /// * `user` - The authenticated user
    /// * `request_body` - The new degree details
    /// 
    /// # Returns
    /// 
    /// * `Result<impl IntoResponse, ChaosError>` - Success message or error
    pub async fn update_degree(
        mut transaction: DBTransaction<'_>,
        user: AuthUser,
        Json(request_body): Json<UserDegree>,
    ) -> Result<impl IntoResponse, ChaosError> {
        User::update_degree(
            user.user_id,
            request_body.degree_name,
            request_body.degree_starting_year,
            &mut transaction.tx,
        )
        .await?;

        transaction.tx.commit().await?;
        Ok(AppMessage::OkMessage("Updated user degree"))
    }

    /// Returns whether the current user is a superuser.
    pub async fn is_superuser(
        mut transaction: DBTransaction<'_>,
        user: AuthUser,
    ) -> Result<impl IntoResponse, ChaosError> {
        let user = User::get(user.user_id, &mut transaction.tx).await?;
        transaction.tx.commit().await?;
        let is_superuser = matches!(user.role, UserRole::SuperUser);
        Ok((StatusCode::OK, Json(serde_json::json!({ "is_superuser": is_superuser }))))
    }
}
