//! Authentication handler for the Chaos application.
//! 
//! This module provides HTTP request handlers for authentication, including:
//! - Google OAuth2 authentication
//! - JWT token generation

use crate::models::app::AppState;
use crate::models::auth::{AuthRequest, GoogleUserProfile};
use crate::models::error::ChaosError;
use crate::service::auth::create_or_get_user_id;
use crate::service::jwt::encode_auth_token;
use axum::extract::{Query, State};
use axum::response::IntoResponse;
use oauth2::reqwest::async_http_client;
use oauth2::{AuthorizationCode, TokenResponse};

/// Handles the Google OAuth2 callback.
/// 
/// This handler processes the OAuth2 code received from Google after user authorization.
/// It exchanges the code for an access token, retrieves the user's profile information,
/// creates or retrieves the user in the database, and generates a JWT token for authentication.
/// 
/// # Arguments
/// 
/// * `state` - The application state
/// * `query` - The OAuth2 callback query parameters containing the authorization code
/// * `oauth_client` - The OAuth2 client for Google authentication
/// 
/// # Returns
/// 
/// * `Result<impl IntoResponse, ChaosError>` - JWT token or error
/// 
/// # Note
/// 
/// Currently returns the JWT token directly. TODO: Return it as a set-cookie header.
pub async fn google_callback(
    State(state): State<AppState>,
    Query(query): Query<AuthRequest>,
) -> Result<impl IntoResponse, ChaosError> {
    let token = state.oauth2_client
        .exchange_code(AuthorizationCode::new(query.code))
        .request_async(async_http_client)
        .await?;

    let profile = state
        .ctx
        .get("https://openidconnect.googleapis.com/v1/userinfo")
        .bearer_auth(token.access_token().secret().to_owned())
        .send()
        .await?;

    let profile = profile.json::<GoogleUserProfile>().await?;

    let user_id = create_or_get_user_id(
        profile.email.clone(),
        profile.name,
        state.db,
        state.snowflake_generator,
    )
    .await?;

    // TODO: Return JWT as set-cookie header.
    let token = encode_auth_token(
        profile.email,
        user_id,
        &state.encoding_key,
        &state.jwt_header,
    );
    Ok(token)
}
