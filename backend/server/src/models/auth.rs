use std::collections::HashMap;
use crate::models::app::AppState;
use crate::models::error::ChaosError;
use crate::service::application::user_is_application_admin;
use crate::service::auth::is_super_user;
use crate::service::campaign::user_is_campaign_admin;
use crate::service::jwt::decode_auth_token;
use crate::service::organisation::user_is_organisation_admin;
use crate::service::role::user_is_role_admin;
use axum::extract::{FromRef, FromRequestParts, Path};
use axum::http::request::Parts;
use axum::response::{IntoResponse, Redirect, Response};
use axum::{async_trait, RequestPartsExt};
use axum_extra::{headers::Cookie, TypedHeader};
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
    type Rejection = ChaosError;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let app_state = AppState::from_ref(state);
        let decoding_key = &app_state.decoding_key;
        let jwt_validator = &app_state.jwt_validator;
        let TypedHeader(cookies) = parts
            .extract::<TypedHeader<Cookie>>()
            .await
            .map_err(|_| ChaosError::NotLoggedIn)?;

        let token = cookies.get("auth_token").ok_or(ChaosError::NotLoggedIn)?;

        let claims =
            decode_auth_token(token, decoding_key, jwt_validator).ok_or(ChaosError::NotLoggedIn)?;

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
            .map_err(|_| ChaosError::NotLoggedIn)?;

        let token = cookies.get("auth_token").ok_or(ChaosError::NotLoggedIn)?;

        let claims =
            decode_auth_token(token, decoding_key, jwt_validator).ok_or(ChaosError::NotLoggedIn)?;

        let pool = &app_state.db;
        let possible_user = is_super_user(claims.sub, pool).await;

        if let Ok(is_auth_user) = possible_user {
            if is_auth_user {
                return Ok(SuperUser {
                    user_id: claims.sub,
                });
            }
        }

        Err(ChaosError::Unauthorized)
    }
}

pub struct OrganisationAdmin {
    pub user_id: i64,
}

#[async_trait]
impl<S> FromRequestParts<S> for OrganisationAdmin
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
            .map_err(|_| ChaosError::NotLoggedIn)?;

        let token = cookies.get("auth_token").ok_or(ChaosError::NotLoggedIn)?;

        let claims =
            decode_auth_token(token, decoding_key, jwt_validator).ok_or(ChaosError::NotLoggedIn)?;

        let pool = &app_state.db;
        let user_id = claims.sub;

        let organisation_id = *parts
            .extract::<Path<HashMap<String ,i64>>>()
            .await
            .map_err(|_| ChaosError::BadRequest)?
            .get("organisation_id")
            .ok_or(ChaosError::BadRequest)?;

        user_is_organisation_admin(user_id, organisation_id, pool).await?;

        Ok(OrganisationAdmin { user_id })
    }
}

pub struct CampaignAdmin {
    pub user_id: i64,
}

#[async_trait]
impl<S> FromRequestParts<S> for CampaignAdmin
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
            .map_err(|_| ChaosError::NotLoggedIn)?;

        let token = cookies.get("auth_token").ok_or(ChaosError::NotLoggedIn)?;

        let claims =
            decode_auth_token(token, decoding_key, jwt_validator).ok_or(ChaosError::NotLoggedIn)?;

        let pool = &app_state.db;
        let user_id = claims.sub;

        let campaign_id = *parts
            .extract::<Path<HashMap<String, i64>>>()
            .await
            .map_err(|_| ChaosError::BadRequest)?
            .get("campaign_id")
            .ok_or(ChaosError::BadRequest)?;

        user_is_campaign_admin(user_id, campaign_id, pool).await?;

        Ok(CampaignAdmin { user_id })
    }
}

pub struct RoleAdmin {
    pub user_id: i64,
}

#[async_trait]
impl<S> FromRequestParts<S> for RoleAdmin
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
            .map_err(|_| ChaosError::NotLoggedIn)?;

        let token = cookies.get("auth_token").ok_or(ChaosError::NotLoggedIn)?;

        let claims =
            decode_auth_token(token, decoding_key, jwt_validator).ok_or(ChaosError::NotLoggedIn)?;

        let pool = &app_state.db;
        let user_id = claims.sub;

        let role_id = *parts
            .extract::<Path<HashMap<String, i64>>>()
            .await
            .map_err(|_| ChaosError::BadRequest)?
            .get("role_id")
            .ok_or(ChaosError::BadRequest)?;

        user_is_role_admin(user_id, role_id, pool).await?;

        Ok(RoleAdmin { user_id })
    }
}

pub struct ApplicationAdmin {
    pub user_id: i64,
}

#[async_trait]
impl<S> FromRequestParts<S> for ApplicationAdmin
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
            .map_err(|_| ChaosError::NotLoggedIn)?;

        let token = cookies.get("auth_token").ok_or(ChaosError::NotLoggedIn)?;

        let claims =
            decode_auth_token(token, decoding_key, jwt_validator).ok_or(ChaosError::NotLoggedIn)?;

        let pool = &app_state.db;
        let user_id = claims.sub;

        let Path(application_id) = parts
            .extract::<Path<i64>>()
            .await
            .map_err(|_| ChaosError::BadRequest)?;

        user_is_application_admin(user_id, application_id, pool).await?;

        Ok(ApplicationAdmin { user_id })
    }
}
