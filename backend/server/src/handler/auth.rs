use crate::models::app::AppState;
use crate::models::auth::{AuthRequest, GoogleUserProfile};
use crate::models::error::ChaosError;
use crate::service::auth::create_or_get_user_id;
use crate::service::jwt::encode_auth_token;
use axum::extract::{Query, State};
use axum_extra::extract::cookie::{Cookie, CookieJar, Expiration};
use axum::response::IntoResponse;
use oauth2::reqwest::async_http_client;
use oauth2::{AuthorizationCode, TokenResponse};
use time::OffsetDateTime;

/// This function handles the passing in of the Google OAuth code. After allowing our app the
/// requested permissions, the user is redirected to this url on our server, where we use the
/// code to get the user's email address from Google's OpenID Connect API.
pub async fn google_callback(
    State(mut state): State<AppState>,
    jar: CookieJar,
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
        &mut state.snowflake_generator,
    )
    .await?;

    let token = encode_auth_token(
        profile.email,
        user_id,
        &state.encoding_key,
        &state.jwt_header,
    );

    // Create a cookie with the token
    let cookie = Cookie::build(("token", token))
        .http_only(true) // Prevent JavaScript access
        .expires(Expiration::DateTime(OffsetDateTime::now_utc() + time::Duration::days(5))) // Set an expiration time of 5 days, TODO: read from env?
        .secure(true)    // Send only over HTTPS, comment out for testing
        .path("/");       // Available for all paths
    // Add the cookie to the response
    Ok(jar.add(cookie))
}

pub struct DevLoginHandler;
impl DevLoginHandler {

    pub async fn dev_super_admin_login(
        State(state): State<AppState>,
        jar: CookieJar
    ) -> Result<impl IntoResponse, ChaosError> {

        if !state.is_dev_env {
            // Disabled for non dev environment
            return Err(ChaosError::ForbiddenOperation);
        }

        let token = encode_auth_token(
            "example.superuser@chaos.devsoc.app".to_string(),
            1,
            &state.encoding_key,
            &state.jwt_header,
        );

        // Create a cookie with the token
        let cookie = Cookie::build(("token", token))
            .http_only(true) // Prevent JavaScript access
            .expires(Expiration::DateTime(OffsetDateTime::now_utc() + time::Duration::days(5))) // Set an expiration time of 5 days, TODO: read from env?
            .secure(true)    // Send only over HTTPS, comment out for testing
            .path("/");       // Available for all paths
        // Add the cookie to the response
        Ok(jar.add(cookie))
    }

    pub async fn dev_org_admin_login(
        State(state): State<AppState>,
        jar: CookieJar
    ) -> Result<impl IntoResponse, ChaosError> {

        if !state.is_dev_env {
            // Disabled for non dev environment
            return Err(ChaosError::ForbiddenOperation);
        }

        let token = encode_auth_token(
            "example.admin@chaos.devsoc.app".to_string(),
            2,
            &state.encoding_key,
            &state.jwt_header,
        );

        // Create a cookie with the token
        let cookie = Cookie::build(("token", token))
            .http_only(true) // Prevent JavaScript access
            .expires(Expiration::DateTime(OffsetDateTime::now_utc() + time::Duration::days(5))) // Set an expiration time of 5 days, TODO: read from env?
            .secure(true)    // Send only over HTTPS, comment out for testing
            .path("/");       // Available for all paths
        // Add the cookie to the response
        Ok(jar.add(cookie))
    }

    pub async fn dev_user_login(
        State(state): State<AppState>,
        jar: CookieJar
    ) -> Result<impl IntoResponse, ChaosError> {

        if !state.is_dev_env {
            // Disabled for non dev environment
            return Err(ChaosError::ForbiddenOperation);
        }

        let token = encode_auth_token(
            "example.user@chaos.devsoc.app".to_string(),
            3,
            &state.encoding_key,
            &state.jwt_header,
        );

        // Create a cookie with the token
        let cookie = Cookie::build(("token", token))
            .http_only(true) // Prevent JavaScript access
            .expires(Expiration::DateTime(OffsetDateTime::now_utc() + time::Duration::days(5))) // Set an expiration time of 5 days, TODO: read from env?
            .secure(true)    // Send only over HTTPS, comment out for testing
            .path("/");       // Available for all paths
        // Add the cookie to the response
        Ok(jar.add(cookie))
    }
}