use crate::models::app::AppState;
use crate::service::auth::is_super_user;
use crate::service::jwt::decode_auth_token;
use axum::extract::{FromRef, FromRequestParts, TypedHeader};
use axum::http::request::Parts;
use axum::response::{IntoResponse, Redirect, Response};

use axum::{
    async_trait, headers,
    http::{self, Request},
    RequestPartsExt,
};
use serde::{Deserialize, Serialize};

// tells the web framework how to take the url query params they will have
#[derive(Deserialize, Serialize)]
pub struct AuthRequest {
    pub code: String,
}

#[derive(Deserialize, Serialize)]
pub struct GoogleUserProfile {
    pub name: String,
    pub email: String,
}

pub struct AuthRedirect;

impl IntoResponse for AuthRedirect {
    fn into_response(self) -> Response {
        // TODO: Fix this redirect to point to front end login page
        Redirect::temporary("/auth/google").into_response()
    }
}

#[derive(Deserialize, Serialize)]
pub struct AuthUser {
    pub user_id: i64,
}

// extractor - takes a request, and we define what we do to it, 
// returns the struct of the type defined
#[async_trait]
impl<S> FromRequestParts<S> for AuthUser
where
    AppState: FromRef<S>,
    S: Send + Sync,
{
    type Rejection = AuthRedirect;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let app_state = AppState::from_ref(state);
        let decoding_key = &app_state.decoding_key;
        let extracted_cookies = parts.extract::<TypedHeader<headers::Cookie>>().await;

        if let Ok(cookies) = extracted_cookies {
            let token = cookies.get("auth_token").ok_or(AuthRedirect)?;
            let claims = decode_auth_token(token.to_string(), decoding_key).ok_or(AuthRedirect)?;

            Ok(AuthUser {
                user_id: claims.sub,
            })
        } else {
            Err(AuthRedirect)
        }
    }
}

#[derive(Deserialize, Serialize)]
pub struct SuperUser {
    pub user_id: i64,
}

#[async_trait]
impl<S> FromRequestParts<S> for SuperUser
where
    AppState: FromRef<S>,
    S: Send + Sync,
{
    type Rejection = AuthRedirect;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let app_state = AppState::from_ref(state);
        let decoding_key = &app_state.decoding_key;
        let extracted_cookies = parts.extract::<TypedHeader<headers::Cookie>>().await;

        if let Ok(cookies) = extracted_cookies {
            let token = cookies.get("auth_token").ok_or(AuthRedirect)?;
            let claims = decode_auth_token(token.to_string(), decoding_key).ok_or(AuthRedirect)?;

            let pool = &app_state.db;
            let possible_user = is_super_user(claims.sub, pool).await;

            if let Ok(is_auth_user) = possible_user {
                if is_auth_user {
                    return Ok(SuperUser {
                        user_id: claims.sub,
                    });
                }
            }
        }

        Err(AuthRedirect)
    }
}
