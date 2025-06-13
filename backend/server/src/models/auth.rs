//! Authentication and authorization module for the Chaos application.
//! 
//! This module provides functionality for handling user authentication and authorization,
//! including OAuth integration with Google, role-based access control, and various
//! permission checks for different parts of the application.

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

/// Request structure for OAuth authentication.
/// 
/// Contains the authorization code received from the OAuth provider.
#[derive(Deserialize, Serialize)]
pub struct AuthRequest {
    /// Authorization code from the OAuth provider
    pub code: String,
}

/// User profile information received from Google OAuth.
/// 
/// Contains basic user information provided by Google after successful authentication.
#[derive(Deserialize, Serialize)]
pub struct GoogleUserProfile {
    /// User's full name
    pub name: String,
    /// User's email address
    pub email: String,
}

/// Response type for authentication redirects.
/// 
/// Handles redirecting users to the appropriate authentication page.
pub struct AuthRedirect;

impl IntoResponse for AuthRedirect {
    fn into_response(self) -> Response {
        // TODO: Fix this redirect to point to front end login page
        Redirect::temporary("/auth/google").into_response()
    }
}

/// Authenticated user information.
/// 
/// Contains the user ID of the currently authenticated user.
#[derive(Deserialize, Serialize)]
pub struct AuthUser {
    /// ID of the authenticated user
    pub user_id: i64,
}

/// Extractor for authenticated users.
/// 
/// This extractor is used in route handlers to ensure that the request
/// comes from an authenticated user.
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

/// Super user information.
/// 
/// Contains the user ID of a user with super user privileges.
#[derive(Deserialize, Serialize)]
pub struct SuperUser {
    /// ID of the super user
    pub user_id: i64,
}

/// Extractor for super users.
/// 
/// This extractor is used in route handlers to ensure that the request
/// comes from a user with super user privileges.
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

/// Organization administrator information.
/// 
/// Contains the user ID of a user with organization administrator privileges.
pub struct OrganisationAdmin {
    /// ID of the organization administrator
    pub user_id: i64,
}

/// Extractor for organization administrators.
/// 
/// This extractor is used in route handlers to ensure that the request
/// comes from a user with organization administrator privileges.
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

/// Campaign administrator information.
/// 
/// Contains the user ID of a user with campaign administrator privileges.
pub struct CampaignAdmin {
    /// ID of the campaign administrator
    pub user_id: i64,
}

/// Extractor for campaign administrators.
/// 
/// This extractor is used in route handlers to ensure that the request
/// comes from a user with campaign administrator privileges.
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

/// Role administrator information.
/// 
/// Contains the user ID of a user with role administrator privileges.
pub struct RoleAdmin {
    /// ID of the role administrator
    pub user_id: i64,
}

/// Extractor for role administrators.
/// 
/// This extractor is used in route handlers to ensure that the request
/// comes from a user with role administrator privileges.
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

/// Application administrator information.
/// 
/// Contains the user ID of a user with application administrator privileges.
pub struct ApplicationAdmin {
    /// ID of the application administrator
    pub user_id: i64,
}

/// Extractor for application administrators.
/// 
/// This extractor is used in route handlers to ensure that the request
/// comes from a user with application administrator privileges.
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

/// Application reviewer information for a specific application.
/// 
/// Contains the user ID of a user who has permission to review a specific application.
pub struct ApplicationReviewerGivenApplicationId {
    /// ID of the application reviewer
    pub user_id: i64,
}

/// Extractor for application reviewers.
/// 
/// This extractor is used in route handlers to ensure that the request
/// comes from a user with permission to review a specific application.
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

/// Application creator information for a specific application.
/// 
/// Contains the user ID of a user who created a specific application.
pub struct ApplicationCreatorGivenApplicationId {
    /// ID of the application creator
    pub user_id: i64,
}

/// Extractor for application creators.
/// 
/// This extractor is used in route handlers to ensure that the request
/// comes from the creator of a specific application.
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

        user_is_application_owner(user_id, application_id, &app_state.db).await?;

        Ok(ApplicationCreatorGivenApplicationId { user_id })
    }
}

/// Application reviewer information for a specific rating.
/// 
/// Contains the user ID of a user who has permission to review an application
/// based on a specific rating.
pub struct ApplicationReviewerGivenRatingId {
    /// ID of the application reviewer
    pub user_id: i64,
}

/// Extractor for application reviewers based on rating.
/// 
/// This extractor is used in route handlers to ensure that the request
/// comes from a user with permission to review an application based on a specific rating.
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

        assert_user_is_application_reviewer_given_rating_id(user_id, rating_id, &app_state.db).await?;

        Ok(ApplicationReviewerGivenRatingId { user_id })
    }
}

/// Rating creator information.
/// 
/// Contains the user ID of a user who created a specific rating.
pub struct RatingCreator {
    /// ID of the rating creator
    pub user_id: i64,
}

/// Extractor for rating creators.
/// 
/// This extractor is used in route handlers to ensure that the request
/// comes from the creator of a specific rating.
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

        assert_user_is_rating_creator_and_organisation_member(user_id, rating_id, &app_state.db).await?;

        Ok(RatingCreator { user_id })
    }
}

/// Question administrator information.
/// 
/// Contains the user ID of a user with question administrator privileges.
pub struct QuestionAdmin {
    /// ID of the question administrator
    pub user_id: i64,
}

/// Extractor for question administrators.
/// 
/// This extractor is used in route handlers to ensure that the request
/// comes from a user with question administrator privileges.
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

        let Path(question_id) = parts
            .extract::<Path<i64>>()
            .await
            .map_err(|_| ChaosError::BadRequest)?;

        user_is_question_admin(user_id, question_id, &app_state.db).await?;

        Ok(QuestionAdmin { user_id })
    }
}

/// Application owner information.
/// 
/// Contains the user ID of a user who owns a specific application.
pub struct ApplicationOwner {
    /// ID of the application owner
    pub user_id: i64,
}

/// Extractor for application owners.
/// 
/// This extractor is used in route handlers to ensure that the request
/// comes from the owner of a specific application.
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

        let Path(application_id) = parts
            .extract::<Path<i64>>()
            .await
            .map_err(|_| ChaosError::BadRequest)?;

        user_is_application_owner(user_id, application_id, &app_state.db).await?;

        Ok(ApplicationOwner { user_id })
    }
}

/// Answer owner information.
/// 
/// Contains the user ID of a user who owns a specific answer.
pub struct AnswerOwner {
    /// ID of the answer owner
    pub user_id: i64,
}

/// Extractor for answer owners.
/// 
/// This extractor is used in route handlers to ensure that the request
/// comes from the owner of a specific answer.
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

        let Path(answer_id) = parts
            .extract::<Path<i64>>()
            .await
            .map_err(|_| ChaosError::BadRequest)?;

        user_is_answer_owner(user_id, answer_id, &app_state.db).await?;

        Ok(AnswerOwner { user_id })
    }
}

/// Email template administrator information.
/// 
/// Contains the user ID of a user with email template administrator privileges.
pub struct EmailTemplateAdmin {
    /// ID of the email template administrator
    pub user_id: i64,
}

/// Extractor for email template administrators.
/// 
/// This extractor is used in route handlers to ensure that the request
/// comes from a user with email template administrator privileges.
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

        let Path(email_template_id) = parts
            .extract::<Path<i64>>()
            .await
            .map_err(|_| ChaosError::BadRequest)?;

        user_is_email_template_admin(user_id, email_template_id, &app_state.db).await?;

        Ok(EmailTemplateAdmin { user_id })
    }
}

/// Offer administrator information.
/// 
/// Contains the user ID of a user with offer administrator privileges.
pub struct OfferAdmin {
    /// ID of the offer administrator
    pub user_id: i64,
}

/// Extractor for offer administrators.
/// 
/// This extractor is used in route handlers to ensure that the request
/// comes from a user with offer administrator privileges.
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

        let Path(offer_id) = parts
            .extract::<Path<i64>>()
            .await
            .map_err(|_| ChaosError::BadRequest)?;

        assert_user_is_offer_admin(user_id, offer_id, &app_state.db).await?;

        Ok(OfferAdmin { user_id })
    }
}

/// Offer recipient information.
/// 
/// Contains the user ID of a user who is the recipient of a specific offer.
pub struct OfferRecipient {
    /// ID of the offer recipient
    pub user_id: i64,
}

/// Extractor for offer recipients.
/// 
/// This extractor is used in route handlers to ensure that the request
/// comes from the recipient of a specific offer.
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

        let Path(offer_id) = parts
            .extract::<Path<i64>>()
            .await
            .map_err(|_| ChaosError::BadRequest)?;

        assert_user_is_offer_recipient(user_id, offer_id, &app_state.db).await?;

        Ok(OfferRecipient { user_id })
    }
}
