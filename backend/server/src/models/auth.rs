use crate::models::app::AppState;
use crate::models::error::ChaosError;
use crate::service::auth::is_super_user;
use crate::service::jwt::decode_auth_token;
use crate::service::organisation::assert_user_is_admin;
use crate::service::ratings::{
    assert_user_is_application_reviewer_admin_given_rating_id, assert_user_is_organisation_member,
    assert_user_is_rating_creator_and_organisation_member,
};
use axum::extract::{FromRef, FromRequestParts, Path};
use axum::http::request::Parts;
use axum::response::{IntoResponse, Redirect, Response};
use axum::{async_trait, RequestPartsExt};
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

        let Path(organisation_id) = parts
            .extract::<Path<i64>>()
            .await
            .map_err(|_| ChaosError::BadRequest)?;

        assert_user_is_admin(user_id, organisation_id, pool).await?;

        Ok(OrganisationAdmin { user_id })
    }
}

// TODO: Not very idiomatic way. The reason this impl was chosen was because we
// couldn't figure out how to dynamically check whether the id passed in path
// was a rating id or an application id.

// TODO: there is currently no diff between ApplicationReviewerAdminGivenApplicationId
// and ApplicationCreatorAdminGivenApplicationId, but that might change, so separating just in case.

/// Get the application reviewer given a path that contains the application id.
pub struct ApplicationReviewerAdminGivenApplicationId {
    pub user_id: i64,
}

#[async_trait]
impl<S> FromRequestParts<S> for ApplicationReviewerAdminGivenApplicationId
where
    AppState: FromRef<S>,
    S: Send + Sync,
{
    type Rejection = ChaosError;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        // TODO: put into separate function, since this is just getting the id through jwt, and duplicated here.
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

        assert_user_is_organisation_member(user_id, application_id, pool).await?;

        Ok(ApplicationReviewerAdminGivenApplicationId { user_id })
    }
}

/// Get the application reviewer given a path that contains the application id.
pub struct ApplicationCreatorAdminGivenApplicationId {
    pub user_id: i64,
}

#[async_trait]
impl<S> FromRequestParts<S> for ApplicationCreatorAdminGivenApplicationId
where
    AppState: FromRef<S>,
    S: Send + Sync,
{
    type Rejection = ChaosError;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        // TODO: put into separate function, since this is just getting the id through jwt, and duplicated here.
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

        assert_user_is_organisation_member(user_id, application_id, pool).await?;

        Ok(ApplicationCreatorAdminGivenApplicationId { user_id })
    }
}

/// Get the application reviewer given a path that contains the rating id.
pub struct ApplicationReviewerAdminGivenRatingId {
    pub user_id: i64,
}

#[async_trait]
impl<S> FromRequestParts<S> for ApplicationReviewerAdminGivenRatingId
where
    AppState: FromRef<S>,
    S: Send + Sync,
{
    type Rejection = ChaosError;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        // TODO: put into separate function, since this is just getting the id through jwt, and duplicated here.
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

        let Path(rating_id) = parts
            .extract::<Path<i64>>()
            .await
            .map_err(|_| ChaosError::BadRequest)?;

        assert_user_is_application_reviewer_admin_given_rating_id(user_id, rating_id, pool).await?;

        Ok(ApplicationReviewerAdminGivenRatingId { user_id })
    }
}

pub struct RatingCreator {
    pub user_id: i64,
}

#[async_trait]
impl<S> FromRequestParts<S> for RatingCreator
where
    AppState: FromRef<S>,
    S: Send + Sync,
{
    type Rejection = ChaosError;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        // TODO: put into separate function, since this is just getting the id through jwt, and duplicated here.
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

        let Path(rating_id) = parts
            .extract::<Path<i64>>()
            .await
            .map_err(|_| ChaosError::BadRequest)?;

        assert_user_is_rating_creator_and_organisation_member(user_id, rating_id, pool).await?;

        Ok(RatingCreator { user_id })
    }
}
