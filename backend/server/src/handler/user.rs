//! User handler for the Chaos application.
//! 
//! This module provides HTTP request handlers for managing user profiles, including:
//! - Retrieving user details
//! - Updating user information (name, pronouns, gender, zid, degree)

use crate::models::app::AppState;
use crate::models::auth::AuthUser;
use crate::models::error::ChaosError;
use crate::models::user::{User, UserDegree, UserGender, UserName, UserPronouns, UserZid};
use axum::extract::{Json, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;

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
        State(state): State<AppState>,
        user: AuthUser,
    ) -> Result<impl IntoResponse, ChaosError> {
        let user = User::get(user.user_id, &state.db).await?;
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
        State(state): State<AppState>,
        user: AuthUser,
        Json(request_body): Json<UserName>,
    ) -> Result<impl IntoResponse, ChaosError> {
        User::update_name(user.user_id, request_body.name, &state.db).await?;

        Ok((StatusCode::OK, "Updated username"))
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
        State(state): State<AppState>,
        user: AuthUser,
        Json(request_body): Json<UserPronouns>,
    ) -> Result<impl IntoResponse, ChaosError> {
        User::update_pronouns(user.user_id, request_body.pronouns, &state.db).await?;

        Ok((StatusCode::OK, "Updated pronouns"))
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
        State(state): State<AppState>,
        user: AuthUser,
        Json(request_body): Json<UserGender>,
    ) -> Result<impl IntoResponse, ChaosError> {
        User::update_gender(user.user_id, request_body.gender, &state.db).await?;

        Ok((StatusCode::OK, "Updated gender"))
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
        State(state): State<AppState>,
        user: AuthUser,
        Json(request_body): Json<UserZid>,
    ) -> Result<impl IntoResponse, ChaosError> {
        User::update_zid(user.user_id, request_body.zid, &state.db).await?;

        Ok((StatusCode::OK, "Updated zid"))
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
        State(state): State<AppState>,
        user: AuthUser,
        Json(request_body): Json<UserDegree>,
    ) -> Result<impl IntoResponse, ChaosError> {
        User::update_degree(
            user.user_id,
            request_body.degree_name,
            request_body.degree_starting_year,
            &state.db,
        )
        .await?;

        Ok((StatusCode::OK, "Updated user degree"))
    }
}
