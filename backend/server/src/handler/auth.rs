//! Authentication handler for the Chaos application.
//!
//! This module provides HTTP request handlers for authentication, including:
//! - Google OAuth2 authentication
//! - JWT token generation

use crate::models::app::AppState;
use crate::models::auth::{AuthRequest, GoogleUserProfile, LoginRequest};
use crate::models::error::ChaosError;
use crate::service::auth::create_or_get_user_id;
use crate::service::jwt::encode_auth_token;
use axum::extract::{Query, State};
use axum::response::{IntoResponse, Redirect};
use axum_extra::extract::cookie::{Cookie, CookieJar, Expiration};
use oauth2::reqwest::async_http_client;
use oauth2::{AuthorizationCode, Scope, TokenResponse};
use time::OffsetDateTime;

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
/// Initiates the Google OAuth2 flow.
///
/// This handler redirects users to Google's OAuth2 authorization URL to begin
/// the authentication process.
///
/// # Arguments
///
/// * `state` - The application state containing the OAuth2 client
///
/// # Returns
///
/// * `Result<impl IntoResponse, ChaosError>` - Redirect to Google OAuth or error
pub async fn google_auth_init(
    State(state): State<AppState>,
    Query(query): Query<LoginRequest>,
) -> Result<impl IntoResponse, ChaosError> {
    let csrf_token = oauth2::CsrfToken::new_random();

    if let Some(to) = query.to {
        sqlx::query!(
            "INSERT INTO redirect_tokens (token, redirect) VALUES ($1, $2)",
            csrf_token.secret(),
            to
        )
        .execute(&state.db)
        .await?;
    }

    let (auth_url, _csrf_token) = state
        .oauth2_client
        .authorize_url(|| csrf_token)
        .add_scope(Scope::new("openid".to_string()))
        .add_scope(Scope::new("email".to_string()))
        .add_scope(Scope::new("profile".to_string()))
        .url();

    Ok(Redirect::to(auth_url.as_str()))
}

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
    State(mut state): State<AppState>,
    jar: CookieJar,
    Query(query): Query<AuthRequest>,
) -> Result<impl IntoResponse, ChaosError> {
    let token = state
        .oauth2_client
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
        &state.db,
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
    let domain = if state.is_dev_env {
        "localhost"
    } else {
        "devsoc.app"
    };

    //let cookie = Cookie::build(("auth_token", token))
    let cookie = Cookie::build(("auth_token", token))
        .http_only(true) // Prevent JavaScript access
        .expires(Expiration::DateTime(
            OffsetDateTime::now_utc() + time::Duration::days(5),
        )) // Set an expiration time of 5 days, TODO: read from env?
        .secure(!state.is_dev_env) // Send only over HTTPS, comment out for testing
        .domain(domain)
        .path("/"); // Available for all paths

    // let cn_cookie = Cookie::build(("auth_token", token))
    //     .http_only(true)
    //     .expires(Expiration::DateTime(OffsetDateTime::now_utc() + time::Duration::days(5)))
    //     .secure(!state.is_dev_env)
    //     .domain("devsoc.cn")
    //     .path("/");

    let redirect_root = if state.is_dev_env {
        "http://localhost:3000"
    } else {
        "https://chaos.devsoc.app"
    };

    let possible_redirect = sqlx::query!(
        "DELETE FROM redirect_tokens WHERE token = $1 RETURNING redirect",
        query.state
    )
    .fetch_optional(&state.db)
    .await?;

    let redirect_url = match possible_redirect {
        Some(redirect) => format!("{redirect_root}{}", redirect.redirect),
        None => format!("{redirect_root}/dashboard"),
    };

    // Ok((jar.add(cookie).add(cn_cookie), Redirect::to(redirect_url.as_str())))
    // Add the cookie and redirect
    Ok((jar.add(cookie), Redirect::to(redirect_url.as_str())))
}

pub async fn logout(
    State(state): State<AppState>,
    jar: CookieJar,
) -> Result<impl IntoResponse, ChaosError> {
    let domain = if state.is_dev_env {
        "localhost"
    } else {
        "devsoc.app"
    };

    let empty_cookie = Cookie::build(("auth_token", ""))
        .http_only(true) // Prevent JavaScript access
        .expires(Expiration::DateTime(
            OffsetDateTime::now_utc() + time::Duration::days(5),
        )) // Set an expiration time of 5 days, TODO: read from env?
        .secure(!state.is_dev_env) // Send only over HTTPS, comment out for testing
        .domain(domain)
        .path("/");

    // let empty_cn_cookie= Cookie::build(("auth_token", ""))
    //     .http_only(true) // Prevent JavaScript access
    //     .expires(Expiration::DateTime(OffsetDateTime::now_utc() + time::Duration::days(5)))
    //     .secure(!state.is_dev_env)
    //     .domain("devsoc.cn")
    //     .path("/");

    let redirect = if state.is_dev_env {
        "http://localhost:3000"
    } else {
        "https://chaos.devsoc.app"
    };

    //Ok((jar.remove(empty_cookie).remove(empty_cn_cookie), Redirect::to(redirect)))
    Ok((jar.remove(empty_cookie), Redirect::to(redirect)))
}

pub struct DevLoginHandler;
impl DevLoginHandler {
    pub async fn dev_super_admin_login(
        State(state): State<AppState>,
        jar: CookieJar,
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
        let cookie = Cookie::build(("auth_token", token))
            .http_only(true) // Prevent JavaScript access
            .expires(Expiration::DateTime(
                OffsetDateTime::now_utc() + time::Duration::days(5),
            )) // Set an expiration time of 5 days, TODO: read from env?
            .path("/"); // Available for all paths

        // Redirect to the frontend dashboard after successful authentication
        let redirect_url = "http://localhost:3000/dashboard";

        // Add the cookie and redirect
        Ok((jar.add(cookie), Redirect::to(redirect_url)))
    }

    pub async fn dev_org_admin_login(
        State(state): State<AppState>,
        jar: CookieJar,
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
        let cookie = Cookie::build(("auth_token", token))
            .http_only(true) // Prevent JavaScript access
            .expires(Expiration::DateTime(
                OffsetDateTime::now_utc() + time::Duration::days(5),
            )) // Set an expiration time of 5 days, TODO: read from env?
            .path("/"); // Available for all paths

        // Redirect to the frontend dashboard after successful authentication
        let redirect_url = "http://localhost:3000/dashboard";

        // Add the cookie and redirect
        Ok((jar.add(cookie), Redirect::to(redirect_url)))
    }

    pub async fn dev_user_login(
        State(state): State<AppState>,
        jar: CookieJar,
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
        let cookie = Cookie::build(("auth_token", token))
            .http_only(true) // Prevent JavaScript access
            .expires(Expiration::DateTime(
                OffsetDateTime::now_utc() + time::Duration::days(5),
            )) // Set an expiration time of 5 days, TODO: read from env?
            .path("/"); // Available for all paths

        // Redirect to the frontend dashboard after successful authentication
        let redirect_url = "http://localhost:3000/dashboard";

        // Add the cookie and redirect
        Ok((jar.add(cookie), Redirect::to(redirect_url)))
    }
}

#[cfg(test)]
mod tests {
    // =========================================================================
    // TEST PLAN – HTTP integration (handler + extractors + auth + DB)
    // =========================================================================
    //
    // Network-free auth handlers driven through the real Router via oneshot:
    //   · GET /auth/google                     -> google_auth_init  (redirects to Google)
    //   · GET /auth/logout                     -> logout            (clears cookie)
    //   · GET /api/v1/dev/super_admin_login     -> dev_super_admin_login (mints cookie)
    //
    //  ID    Scenario                       Expected                          Test
    //  EP01  init OAuth flow                303 -> accounts.google.com        google_init_redirects_to_google
    //  EP02  logout (while authed)          303 + auth_token clearing cookie   logout_clears_auth_cookie
    //  EP03  dev super-admin login          303 + auth_token Set-Cookie        dev_login_issues_auth_cookie
    //
    // KNOWN GAPS: google_callback exchanges a code with Google and calls the
    // userinfo endpoint over the network, so it cannot run against a stub and is
    // not driven here. The is_dev_env=false guard on the dev-login handlers is not
    // exercised (the test state is always dev).
    // =========================================================================

    use super::*;
    use crate::test_support::*;
    use axum::routing::get;
    use axum::Router;
    use sqlx::PgPool;
    use tower::ServiceExt;

    fn router(pool: PgPool) -> Router {
        Router::new()
            .route("/auth/google", get(google_auth_init))
            .route("/auth/logout", get(logout))
            .route(
                "/api/v1/dev/super_admin_login",
                get(DevLoginHandler::dev_super_admin_login),
            )
            .with_state(test_state(pool))
    }

    /// Concatenated Set-Cookie header values on a response.
    fn set_cookies(response: &axum::response::Response) -> String {
        response
            .headers()
            .get_all(axum::http::header::SET_COOKIE)
            .iter()
            .map(|v| v.to_str().unwrap_or(""))
            .collect::<Vec<_>>()
            .join("; ")
    }

    /// White-box: the OAuth init redirects the browser to Google's consent screen.
    #[sqlx::test(migrations = "../migrations")]
    async fn google_init_redirects_to_google(pool: PgPool) {
        let response = router(pool.clone())
            .oneshot(request("GET", "/auth/google", None, None))
            .await
            .unwrap();

        assert!(response.status().is_redirection(), "should be a 3xx redirect");
        let location = response
            .headers()
            .get(axum::http::header::LOCATION)
            .unwrap()
            .to_str()
            .unwrap();
        assert!(
            location.contains("accounts.google.com"),
            "should redirect to Google, got {location}"
        );
    }

    /// White-box: logging out while authenticated emits a Set-Cookie that clears
    /// the auth_token (a removal cookie is only written when one was presented).
    #[sqlx::test(migrations = "../migrations")]
    async fn logout_clears_auth_cookie(pool: PgPool) {
        let response = router(pool.clone())
            .oneshot(request("GET", "/auth/logout", Some(1), None))
            .await
            .unwrap();

        assert!(response.status().is_redirection());
        assert!(
            set_cookies(&response).contains("auth_token"),
            "logout should clear the auth_token cookie"
        );
    }

    /// White-box: the dev super-admin login mints an auth_token cookie (dev env).
    #[sqlx::test(migrations = "../migrations")]
    async fn dev_login_issues_auth_cookie(pool: PgPool) {
        let response = router(pool.clone())
            .oneshot(request("GET", "/api/v1/dev/super_admin_login", None, None))
            .await
            .unwrap();

        assert!(response.status().is_redirection());
        assert!(
            set_cookies(&response).contains("auth_token="),
            "dev login should issue an auth_token cookie"
        );
    }
}
