use crate::models::app::AppState;
use crate::models::error::ChaosError;
use crate::service::auth::is_super_user;
use crate::service::jwt::decode_auth_token;
use axum::extract::{FromRef, FromRequestParts};
use axum::http::request::Parts;
use axum::response::{IntoResponse, Redirect, Response};
use axum::{
    async_trait,
    RequestPartsExt,
};
use axum_extra::{headers::Cookie, TypedHeader};
use serde::{Deserialize, Serialize};

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

#[async_trait]
impl<S> FromRequestParts<S> for AuthUser
where
    AppState: FromRef<S>,
    S: Send + Sync,
{
    type Rejection = ChaosError;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let app_state = AppState::from_ref(state);
        let decoding_key = &app_state.decoding_key;
        let jwt_validator = &app_state.jwt_validator;
        let TypedHeader(cookies) = parts
            .extract::<TypedHeader<Cookie>>()
            .await
            .map_err(|_| ChaosError::NotLoggedInError)?;

        let token = cookies.get("auth_token").ok_or(ChaosError::NotLoggedInError)?;

        let claims =
            decode_auth_token(token, decoding_key, jwt_validator).ok_or(ChaosError::NotLoggedInError)?;

        Ok(AuthUser {
            user_id: claims.sub,
        })
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
    type Rejection = ChaosError;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let app_state = AppState::from_ref(state);
        let decoding_key = &app_state.decoding_key;
        let jwt_validator = &app_state.jwt_validator;
        let TypedHeader(cookies) = parts
            .extract::<TypedHeader<Cookie>>()
            .await
            .map_err(|_| ChaosError::NotLoggedInError)?;

        let token = cookies.get("auth_token").ok_or(ChaosError::NotLoggedInError)?;

        let claims =
            decode_auth_token(token, decoding_key, jwt_validator).ok_or(ChaosError::NotLoggedInError)?;
        let pool = &app_state.db;
        let possible_user = is_super_user(claims.sub, pool).await;

        if let Ok(is_auth_user) = possible_user {
            if is_auth_user {
                return Ok(SuperUser {
                    user_id: claims.sub,
                });
            }
        }

        Err(ChaosError::UnauthorizedError)
    }
}
