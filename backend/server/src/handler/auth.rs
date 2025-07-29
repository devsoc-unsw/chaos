use crate::models::app::AppState;
use crate::models::auth::{AuthRequest, GoogleUserProfile};
use crate::models::error::ChaosError;
use crate::service::auth::create_or_get_user_id;
use crate::service::jwt::encode_auth_token;
use axum::extract::{Query, State};
use axum_extra::extract::cookie::{Cookie, CookieJar, Expiration};
use axum::response::{IntoResponse, Redirect};
use oauth2::reqwest::async_http_client;
use oauth2::{AuthorizationCode, TokenResponse};
use time::OffsetDateTime;
use crate::service::oauth2::get_google_auth_url;

/// This function handles the passing in of the Google OAuth code. After allowing our app the
/// requested permissions, the user is redirected to this url on our server, where we use the
/// code to get the user's email address from Google's OpenID Connect API.
pub async fn google_callback(
    State(state): State<AppState>,
    jar: CookieJar,
    Query(query): Query<AuthRequest>,
) -> Result<impl IntoResponse, ChaosError> {
    println!("Received OAuth callback with code: {}", query.code);
    
    let token = state.oauth2_client
        .exchange_code(AuthorizationCode::new(query.code))
        .request_async(async_http_client)
        .await
        .map_err(|e| {
            eprintln!("OAuth error details: {:?}", e);
            ChaosError::OAuthError(e)
        })?;

    println!("Successfully exchanged code for token");

    let profile = state
        .ctx
        .get("https://openidconnect.googleapis.com/v1/userinfo")
        .bearer_auth(token.access_token().secret().to_owned())
        .send()
        .await
        .map_err(|e| {
            eprintln!("Profile request error: {:?}", e);
            ChaosError::ReqwestError(e)
        })?;

    println!("Successfully retrieved user profile");

    let profile = profile.json::<GoogleUserProfile>().await
        .map_err(|e| {
            eprintln!("Profile parse error: {:?}", e);
            ChaosError::ReqwestError(e)
        })?;

    println!("Successfully parsed user profile - Email: {}, Name: {}", profile.email, profile.name);

    let user_id = create_or_get_user_id(
        profile.email.clone(),
        profile.name,
        state.db,
        state.snowflake_generator,
    )
    .await?;

    println!("Successfully created/retrieved user with ID: {}", user_id);

    let token = encode_auth_token(
        profile.email,
        user_id,
        &state.encoding_key,
        &state.jwt_header,
    );

    println!("Successfully generated JWT token");

    // Create a cookie with the token
    let mut cookie = Cookie::build(("auth_token", token))
        .http_only(true) // Prevent JavaScript access
        .expires(Expiration::DateTime(OffsetDateTime::now_utc() + time::Duration::days(5))) // Set an expiration time of 5 days, TODO: read from env?
        .path("/"); // Available for all paths
    
    // Only set secure and SameSite=None in production
    if std::env::var("RUST_ENV").unwrap_or_else(|_| "development".to_string()) == "production" {
        cookie = cookie
            .secure(true)    // Required for SameSite=None in production
            .same_site(axum_extra::extract::cookie::SameSite::None);
    } else {
        // In development, use SameSite=Lax for HTTP
        cookie = cookie.same_site(axum_extra::extract::cookie::SameSite::Lax);
    }

    println!("Cookie being set: {:?}", cookie);
    println!("Successfully created cookie, redirecting to frontend");
    
    // Add the cookie to the response and redirect to frontend
    let response = jar.add(cookie);
    Ok((response, Redirect::to("http://localhost:3000/auth/success")).into_response())
}

pub async fn google_login(
    State(state): State<AppState>,
) -> Result<impl IntoResponse, ChaosError> {
    let auth_url = get_google_auth_url(&state.oauth2_client);
    Ok(Redirect::to(&auth_url))
}
