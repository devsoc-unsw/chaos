use crate::models::app::AppState;
use crate::models::error::ChaosError;
use crate::service::answer::user_is_answer_owner;
use crate::service::application::{user_is_application_admin, user_is_application_owner};
use crate::service::auth::{assert_is_super_user, extract_user_id_from_request};
use crate::service::campaign::user_is_campaign_admin;
use crate::service::email_template::user_is_email_template_admin;
use crate::service::offer::{assert_user_is_offer_admin, assert_user_is_offer_recipient};
use crate::service::organisation::assert_user_is_organisation_admin;
use crate::service::question::user_is_question_admin;
use crate::service::rating::{
    assert_user_is_application_reviewer_given_rating_id, assert_user_is_organisation_member,
    assert_user_is_rating_creator_and_organisation_member,
};
use crate::service::role::user_is_role_admin;
use axum::extract::{FromRef, FromRequestParts, Path};
use axum::http::request::Parts;
use axum::response::{IntoResponse, Redirect, Response};
use axum::{async_trait, RequestPartsExt};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

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
        let user_id = extract_user_id_from_request(parts, &app_state).await?;

        Ok(AuthUser { user_id })
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
        let user_id = extract_user_id_from_request(parts, &app_state).await?;

        assert_is_super_user(user_id, &app_state.db).await?;

        Ok(SuperUser { user_id })
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
        let user_id = extract_user_id_from_request(parts, &app_state).await?;

        let organisation_id = *parts
            .extract::<Path<HashMap<String, i64>>>()
            .await
            .map_err(|_| ChaosError::BadRequest)?
            .get("organisation_id")
            .ok_or(ChaosError::BadRequest)?;

        assert_user_is_organisation_admin(user_id, organisation_id, &app_state.db).await?;

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
        let user_id = extract_user_id_from_request(parts, &app_state).await?;

        let campaign_id = *parts
            .extract::<Path<HashMap<String, i64>>>()
            .await
            .map_err(|_| ChaosError::BadRequest)?
            .get("campaign_id")
            .ok_or(ChaosError::BadRequest)?;

        user_is_campaign_admin(user_id, campaign_id, &app_state.db).await?;

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
        let user_id = extract_user_id_from_request(parts, &app_state).await?;

        let role_id = *parts
            .extract::<Path<HashMap<String, i64>>>()
            .await
            .map_err(|_| ChaosError::BadRequest)?
            .get("role_id")
            .ok_or(ChaosError::BadRequest)?;

        user_is_role_admin(user_id, role_id, &app_state.db).await?;

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
        let user_id = extract_user_id_from_request(parts, &app_state).await?;

        let Path(application_id) = parts
            .extract::<Path<i64>>()
            .await
            .map_err(|_| ChaosError::BadRequest)?;

        user_is_application_admin(user_id, application_id, &app_state.db).await?;

        Ok(ApplicationAdmin { user_id })
    }
}

// TODO: Not very idiomatic way. The reason this impl was chosen was because we
// couldn't figure out how to dynamically check whether the id passed in path
// was a rating id or an application id.

// TODO: there is currently no diff between ApplicationReviewerAdminGivenApplicationId
// and ApplicationCreatorAdminGivenApplicationId, but that might change, so separating just in case.

/// Get the application reviewer given a path that contains the application id.
pub struct ApplicationReviewerGivenApplicationId {
    pub user_id: i64,
}

#[async_trait]
impl<S> FromRequestParts<S> for ApplicationReviewerGivenApplicationId
where
    AppState: FromRef<S>,
    S: Send + Sync,
{
    type Rejection = ChaosError;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let app_state = AppState::from_ref(state);
        let user_id = extract_user_id_from_request(parts, &app_state).await?;

        let Path(application_id) = parts
            .extract::<Path<i64>>()
            .await
            .map_err(|_| ChaosError::BadRequest)?;

        assert_user_is_organisation_member(user_id, application_id, &app_state.db).await?;

        Ok(ApplicationReviewerGivenApplicationId { user_id })
    }
}

/// Get the application reviewer given a path that contains the application id.
pub struct ApplicationCreatorGivenApplicationId {
    pub user_id: i64,
}

#[async_trait]
impl<S> FromRequestParts<S> for ApplicationCreatorGivenApplicationId
where
    AppState: FromRef<S>,
    S: Send + Sync,
{
    type Rejection = ChaosError;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let app_state = AppState::from_ref(state);
        let user_id = extract_user_id_from_request(parts, &app_state).await?;

        let Path(application_id) = parts
            .extract::<Path<i64>>()
            .await
            .map_err(|_| ChaosError::BadRequest)?;

        assert_user_is_organisation_member(user_id, application_id, &app_state.db).await?;

        Ok(ApplicationCreatorGivenApplicationId { user_id })
    }
}

/// Get the application reviewer given a path that contains the rating id.
pub struct ApplicationReviewerGivenRatingId {
    pub user_id: i64,
}

#[async_trait]
impl<S> FromRequestParts<S> for ApplicationReviewerGivenRatingId
where
    AppState: FromRef<S>,
    S: Send + Sync,
{
    type Rejection = ChaosError;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let app_state = AppState::from_ref(state);
        let user_id = extract_user_id_from_request(parts, &app_state).await?;

        let Path(rating_id) = parts
            .extract::<Path<i64>>()
            .await
            .map_err(|_| ChaosError::BadRequest)?;

        assert_user_is_application_reviewer_given_rating_id(user_id, rating_id, &app_state.db)
            .await?;

        Ok(ApplicationReviewerGivenRatingId { user_id })
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
        let app_state = AppState::from_ref(state);
        let user_id = extract_user_id_from_request(parts, &app_state).await?;

        let Path(rating_id) = parts
            .extract::<Path<i64>>()
            .await
            .map_err(|_| ChaosError::BadRequest)?;

        assert_user_is_rating_creator_and_organisation_member(user_id, rating_id, &app_state.db)
            .await?;

        Ok(RatingCreator { user_id })
    }
}

pub struct QuestionAdmin {
    pub user_id: i64,
}

#[async_trait]
impl<S> FromRequestParts<S> for QuestionAdmin
where
    AppState: FromRef<S>,
    S: Send + Sync,
{
    type Rejection = ChaosError;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let app_state = AppState::from_ref(state);
        let user_id = extract_user_id_from_request(parts, &app_state).await?;

        let question_id = *parts
            .extract::<Path<HashMap<String, i64>>>()
            .await
            .map_err(|_| ChaosError::BadRequest)?
            .get("question_id")
            .ok_or(ChaosError::BadRequest)?;

        user_is_question_admin(user_id, question_id, &app_state.db).await?;

        Ok(QuestionAdmin { user_id })
    }
}

pub struct ApplicationOwner {
    pub user_id: i64,
}

#[async_trait]
impl<S> FromRequestParts<S> for ApplicationOwner
where
    AppState: FromRef<S>,
    S: Send + Sync,
{
    type Rejection = ChaosError;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let app_state = AppState::from_ref(state);
        let user_id = extract_user_id_from_request(parts, &app_state).await?;

        let application_id = *parts
            .extract::<Path<HashMap<String, i64>>>()
            .await
            .map_err(|_| ChaosError::BadRequest)?
            .get("application_id")
            .ok_or(ChaosError::BadRequest)?;

        user_is_application_owner(user_id, application_id, &app_state.db).await?;

        Ok(ApplicationOwner { user_id })
    }
}

pub struct AnswerOwner {
    pub user_id: i64,
}

#[async_trait]
impl<S> FromRequestParts<S> for AnswerOwner
where
    AppState: FromRef<S>,
    S: Send + Sync,
{
    type Rejection = ChaosError;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let app_state = AppState::from_ref(state);
        let user_id = extract_user_id_from_request(parts, &app_state).await?;

        let application_id = *parts
            .extract::<Path<HashMap<String, i64>>>()
            .await
            .map_err(|_| ChaosError::BadRequest)?
            .get("application_id")
            .ok_or(ChaosError::BadRequest)?;

        user_is_answer_owner(user_id, application_id, &app_state.db).await?;

        Ok(AnswerOwner { user_id })
    }
}

pub struct EmailTemplateAdmin {
    pub user_id: i64,
}

#[async_trait]
impl<S> FromRequestParts<S> for EmailTemplateAdmin
where
    AppState: FromRef<S>,
    S: Send + Sync,
{
    type Rejection = ChaosError;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let app_state = AppState::from_ref(state);
        let user_id = extract_user_id_from_request(parts, &app_state).await?;

        let template_id = *parts
            .extract::<Path<HashMap<String, i64>>>()
            .await
            .map_err(|_| ChaosError::BadRequest)?
            .get("template_id")
            .ok_or(ChaosError::BadRequest)?;

        user_is_email_template_admin(user_id, template_id, &app_state.db).await?;

        Ok(EmailTemplateAdmin { user_id })
    }
}

pub struct OfferAdmin {
    pub user_id: i64,
}

#[async_trait]
impl<S> FromRequestParts<S> for OfferAdmin
where
    AppState: FromRef<S>,
    S: Send + Sync,
{
    type Rejection = ChaosError;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let app_state = AppState::from_ref(state);
        let user_id = extract_user_id_from_request(parts, &app_state).await?;

        let offer_id = *parts
            .extract::<Path<HashMap<String, i64>>>()
            .await
            .map_err(|_| ChaosError::BadRequest)?
            .get("offer_id")
            .ok_or(ChaosError::BadRequest)?;

        assert_user_is_offer_admin(user_id, offer_id, &app_state.db).await?;

        Ok(OfferAdmin { user_id })
    }
}

pub struct OfferRecipient {
    pub user_id: i64,
}

#[async_trait]
impl<S> FromRequestParts<S> for OfferRecipient
where
    AppState: FromRef<S>,
    S: Send + Sync,
{
    type Rejection = ChaosError;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let app_state = AppState::from_ref(state);
        let user_id = extract_user_id_from_request(parts, &app_state).await?;

        let offer_id = *parts
            .extract::<Path<HashMap<String, i64>>>()
            .await
            .map_err(|_| ChaosError::BadRequest)?
            .get("offer_id")
            .ok_or(ChaosError::BadRequest)?;

        assert_user_is_offer_recipient(user_id, offer_id, &app_state.db).await?;

        Ok(OfferRecipient { user_id })
    }
}
