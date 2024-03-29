use oauth2::basic::BasicClient;
use oauth2::{AuthUrl, ClientId, ClientSecret, RedirectUrl, TokenUrl};
use std::env;

/// Returns a oauth2::BasicClient, setup with settings for CHAOS Google OAuth.
/// Client follows OAuth2 Standard (https://oauth.net/2/) to get user's email
/// using OpenID Connect (https://openid.net/developers/how-connect-works/).
pub fn build_oauth_client(client_id: String, client_secret: String) -> BasicClient {
    let hostname = env::var("CHAOS_HOSTNAME").expect("Could not read CHAOS hostname");

    let redirect_url = format!("{}/api/auth/google_callback", hostname);

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
