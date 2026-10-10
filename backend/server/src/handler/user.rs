//! User handler for the Chaos application.
//!
//! This module provides HTTP request handlers for managing user profiles, including:
//! - Retrieving user details
//! - Updating user information (name, pronouns, gender, zid, degree)

use crate::models::app::{AppMessage, AppState};
use crate::models::error::ChaosError;
use crate::models::transaction::DBTransaction;
use crate::models::user::{User, UserDegree, UserGender, UserName, UserPronouns, UserZid};
use crate::spicedb::{policies::UsePlatform, schema as spicedb_schema, SpiceDbAuth};
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
    /// * `transaction` - Database transaction
    /// * `auth` - The authenticated user, authorized by `SpiceDbAuth<UsePlatform>`
    ///
    /// # Returns
    ///
    /// * `Result<impl IntoResponse, ChaosError>` - User details or error
    pub async fn get(
        mut transaction: DBTransaction<'_>,
        auth: SpiceDbAuth<UsePlatform>,
    ) -> Result<impl IntoResponse, ChaosError> {
        let user = User::get(auth.user_id, &mut transaction.tx).await?;

        transaction.commit().await?;
        Ok((StatusCode::OK, Json(user)))
    }

    /// Updates the user's name.
    ///
    /// This handler allows users to update their name.
    ///
    /// # Arguments
    ///
    /// * `transaction` - Database transaction
    /// * `auth` - The authenticated user, authorized by `SpiceDbAuth<UsePlatform>`
    /// * `request_body` - The new name
    ///
    /// # Returns
    ///
    /// * `Result<impl IntoResponse, ChaosError>` - Success message or error
    pub async fn update_name(
        mut transaction: DBTransaction<'_>,
        auth: SpiceDbAuth<UsePlatform>,
        Json(request_body): Json<UserName>,
    ) -> Result<impl IntoResponse, ChaosError> {
        User::update_name(auth.user_id, request_body.name, &mut transaction.tx).await?;

        transaction.commit().await?;
        Ok(AppMessage::OkMessage("Updated username"))
    }

    /// Updates the user's pronouns.
    ///
    /// This handler allows users to update their pronouns.
    ///
    /// # Arguments
    ///
    /// * `transaction` - Database transaction
    /// * `auth` - The authenticated user, authorized by `SpiceDbAuth<UsePlatform>`
    /// * `request_body` - The new pronouns
    ///
    /// # Returns
    ///
    /// * `Result<impl IntoResponse, ChaosError>` - Success message or error
    pub async fn update_pronouns(
        mut transaction: DBTransaction<'_>,
        auth: SpiceDbAuth<UsePlatform>,
        Json(request_body): Json<UserPronouns>,
    ) -> Result<impl IntoResponse, ChaosError> {
        User::update_pronouns(auth.user_id, request_body.pronouns, &mut transaction.tx).await?;

        transaction.commit().await?;
        Ok(AppMessage::OkMessage("Updated pronouns"))
    }

    /// Updates the user's gender.
    ///
    /// This handler allows users to update their gender.
    ///
    /// # Arguments
    ///
    /// * `transaction` - Database transaction
    /// * `auth` - The authenticated user, authorized by `SpiceDbAuth<UsePlatform>`
    /// * `request_body` - The new gender
    ///
    /// # Returns
    ///
    /// * `Result<impl IntoResponse, ChaosError>` - Success message or error
    pub async fn update_gender(
        mut transaction: DBTransaction<'_>,
        auth: SpiceDbAuth<UsePlatform>,
        Json(request_body): Json<UserGender>,
    ) -> Result<impl IntoResponse, ChaosError> {
        User::update_gender(auth.user_id, request_body.gender, &mut transaction.tx).await?;

        transaction.commit().await?;
        Ok(AppMessage::OkMessage("Updated gender"))
    }

    /// Updates the user's zid.
    ///
    /// This handler allows users to update their zid.
    ///
    /// # Arguments
    ///
    /// * `transaction` - Database transaction
    /// * `auth` - The authenticated user, authorized by `SpiceDbAuth<UsePlatform>`
    /// * `request_body` - The new zid
    ///
    /// # Returns
    ///
    /// * `Result<impl IntoResponse, ChaosError>` - Success message or error
    pub async fn update_zid(
        mut transaction: DBTransaction<'_>,
        auth: SpiceDbAuth<UsePlatform>,
        Json(request_body): Json<UserZid>,
    ) -> Result<impl IntoResponse, ChaosError> {
        User::update_zid(auth.user_id, request_body.zid, &mut transaction.tx).await?;

        transaction.commit().await?;
        Ok(AppMessage::OkMessage("Updated zid"))
    }

    /// Updates the user's degree information.
    ///
    /// This handler allows users to update their degree details.
    ///
    /// # Arguments
    ///
    /// * `transaction` - Database transaction
    /// * `auth` - The authenticated user, authorized by `SpiceDbAuth<UsePlatform>`
    /// * `request_body` - The new degree details
    ///
    /// # Returns
    ///
    /// * `Result<impl IntoResponse, ChaosError>` - Success message or error
    pub async fn update_degree(
        mut transaction: DBTransaction<'_>,
        auth: SpiceDbAuth<UsePlatform>,
        Json(request_body): Json<UserDegree>,
    ) -> Result<impl IntoResponse, ChaosError> {
        User::update_degree(
            auth.user_id,
            request_body.degree_name,
            request_body.degree_starting_year,
            &mut transaction.tx,
        )
        .await?;

        transaction.commit().await?;
        Ok(AppMessage::OkMessage("Updated user degree"))
    }

    /// Returns whether the current user is a superuser.
    ///
    /// Superuser status is the SpiceDB platform `manage` permission, mirroring
    /// the authorization used elsewhere, rather than the Postgres `users.role`
    /// column.
    ///
    /// # Arguments
    ///
    /// * `state` - The application state, used for the SpiceDB permission check
    /// * `auth` - The authenticated user, authorized by `SpiceDbAuth<UsePlatform>`
    ///
    /// # Returns
    ///
    /// * `Result<impl IntoResponse, ChaosError>` - JSON containing the `is_superuser` boolean or error
    pub async fn is_superuser(
        State(state): State<AppState>,
        auth: SpiceDbAuth<UsePlatform>,
    ) -> Result<impl IntoResponse, ChaosError> {
        let is_superuser = match state
            .check_permission(
                auth.user_id,
                spicedb_schema::resource::PLATFORM,
                spicedb_schema::PLATFORM_RESOURCE_ID,
                spicedb_schema::permission::platform::MANAGE,
            )
            .await
        {
            Ok(()) => true,
            Err(ChaosError::ForbiddenOperation) => false,
            Err(e) => return Err(e),
        };

        Ok((
            StatusCode::OK,
            Json(serde_json::json!({ "is_superuser": is_superuser })),
        ))
    }
}
