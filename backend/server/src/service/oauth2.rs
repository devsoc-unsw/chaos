//! OAuth2 service for the Chaos application.
//! 
//! This module provides functionality for OAuth2 authentication with Google,
//! including client setup and configuration for OpenID Connect.

use oauth2::basic::BasicClient;
use oauth2::{AuthUrl, ClientId, ClientSecret, RedirectUrl, TokenUrl};
use std::env;

/// Builds and configures an OAuth2 client for Google authentication.
/// 
/// This function creates a BasicClient configured with Google's OAuth2 endpoints
/// and the application's client credentials. The client follows the OAuth2 standard
/// and OpenID Connect protocol to authenticate users and retrieve their email.
/// 
/// # Arguments
/// 
/// * `client_id` - The Google OAuth2 client ID
/// * `client_secret` - The Google OAuth2 client secret
/// 
/// # Returns
/// 
/// * `BasicClient` - A configured OAuth2 client ready for authentication
/// 
/// # Panics
/// 
/// This function will panic if:
/// * The `CHAOS_HOSTNAME` environment variable is not set
/// * The redirect URL cannot be parsed
/// 
/// # Example
/// 
/// ```rust
/// let client = build_oauth_client(
///     "your-client-id".to_string(),
///     "your-client-secret".to_string()
/// );
/// ```
pub fn build_oauth_client(client_id: String, client_secret: String) -> BasicClient {
    let redirect_url = env::var("GOOGLE_REDIRECT_URI").expect("Could not read GOOGLE_REDIRECT_URI");

    let auth_url = AuthUrl::new("https://accounts.google.com/o/oauth2/v2/auth".to_string())
        .expect("Invalid authorization endpoint URL");
    let token_url = TokenUrl::new("https://www.googleapis.com/oauth2/v3/token".to_string())
        .expect("Invalid token endpoint URL");

    BasicClient::new(
        ClientId::new(client_id),
        Some(ClientSecret::new(client_secret)),
        auth_url,
        Some(token_url),
    )
    .set_redirect_uri(RedirectUrl::new(redirect_url).unwrap())
}
