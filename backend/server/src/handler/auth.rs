use crate::models::app::AppState;
use crate::models::auth::{AuthRequest, GoogleUserProfile};
use crate::service::auth::create_or_get_user_id;
use axum::extract::{Query, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::Extension;
use log::error;
use oauth2::basic::BasicClient;
use oauth2::reqwest::async_http_client;
use oauth2::{AuthorizationCode, TokenResponse};

/// This function handles the passing in of the Google OAuth code. After allowing our app the
/// requested permissions, the user is redirected to this url on our server, where we use the
/// code to get the user's email address from Google's OpenID Connect API.
pub async fn google_callback(
    State(state): State<AppState>,
    Query(query): Query<AuthRequest>,
    Extension(oauth_client): Extension<BasicClient>,
) -> Result<impl IntoResponse, impl IntoResponse> {
    let token = match oauth_client
        .exchange_code(AuthorizationCode::new(query.code))
        .request_async(async_http_client)
        .await
    {
        Ok(res) => res,
        Err(e) => {
            error!("An error occured while exchanging Google OAuth code");
            return Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string()));
        }
    };

    let profile = match state
        .ctx
        .get("https://openidconnect.googleapis.com/v1/userinfo")
        .bearer_auth(token.access_token().secret().to_owned())
        .send()
        .await
    {
        Ok(res) => res,
        Err(e) => return Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    };

    let profile = profile.json::<GoogleUserProfile>().await.unwrap();

    let user_id = create_or_get_user_id(
        profile.email,
        profile.name,
        state.db,
        state.snowflake_generator,
    )
    .await
    .unwrap();

    // TODO: Create a JWT from this user_id and return to the user.
    Ok("woohoo")
}
