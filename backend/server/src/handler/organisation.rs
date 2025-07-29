//! Organisation handler for the Chaos application.
//! 
//! This module provides HTTP request handlers for managing organisations, including:
//! - Organisation CRUD operations
//! - Member and admin management
//! - Campaign management
//! - Email template management
//! - Logo image handling

use crate::models::app::AppState;
use crate::models::auth::SuperUser;
use crate::models::auth::{AuthUser, OrganisationAdmin};
use crate::models::campaign::{Campaign, NewCampaign};
use crate::models::email_template::{EmailTemplate, NewEmailTemplate};
use crate::models::error::ChaosError;
use crate::models::organisation::{
    AdminToRemove, AdminUpdateList, NewOrganisation, Organisation, SlugCheck,
};
use crate::models::transaction::DBTransaction;
use axum::extract::{Json, Path, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;

/// Handler for organisation-related HTTP requests.
pub struct OrganisationHandler;

impl OrganisationHandler {
    /// Creates a new organisation.
    /// 
    /// This handler allows super users to create new organisations.
    /// 
    /// # Arguments
    /// 
    /// * `state` - The application state
    /// * `_user` - The authenticated user (must be a super user)
    /// * `transaction` - Database transaction
    /// * `data` - The new organisation details
    /// 
    /// # Returns
    /// 
    /// * `Result<impl IntoResponse, ChaosError>` - Success message or error
    pub async fn create(
        State(mut state): State<AppState>,
        _user: SuperUser,
        mut transaction: DBTransaction<'_>,
        Json(data): Json<NewOrganisation>,
    ) -> Result<impl IntoResponse, ChaosError> {
        Organisation::create(
            data.admin,
            data.slug,
            data.name,
            &mut state.snowflake_generator,
            &mut transaction.tx,
        )
        .await?;

        transaction.tx.commit().await?;
        Ok((StatusCode::OK, "Successfully created organisation"))
    }

    /// Checks if an organisation slug is available.
    /// 
    /// This handler allows super users to check slug availability.
    /// 
    /// # Arguments
    /// 
    /// * `state` - The application state
    /// * `_user` - The authenticated user (must be a super user)
    /// * `data` - The slug to check
    /// 
    /// # Returns
    /// 
    /// * `Result<impl IntoResponse, ChaosError>` - Success message or error
    pub async fn check_organisation_slug_availability(
        mut transaction: DBTransaction<'_>,
        _user: SuperUser,
        Json(data): Json<SlugCheck>,
    ) -> Result<impl IntoResponse, ChaosError> {
        Organisation::check_slug_availability(data.slug, &mut transaction.tx).await?;

        transaction.tx.commit().await?;
        Ok((StatusCode::OK, "Organisation slug is available"))
    }

    /// Retrieves an organisation by its ID.
    /// 
    /// This handler allows any authenticated user to view organisation details.
    /// 
    /// # Arguments
    /// 
    /// * `state` - The application state
    /// * `id` - The ID of the organisation to retrieve
    /// * `_user` - The authenticated user
    /// 
    /// # Returns
    /// 
    /// * `Result<impl IntoResponse, ChaosError>` - Organisation details or error
    pub async fn get(
        mut transaction: DBTransaction<'_>,
        Path(id): Path<i64>,
        _user: AuthUser,
    ) -> Result<impl IntoResponse, ChaosError> {
        let org = Organisation::get(id, &mut transaction.tx).await?;
        transaction.tx.commit().await?;
        Ok((StatusCode::OK, Json(org)))
    }

    /// Retrieves an organisation by its slug.
    /// 
    /// This handler allows any authenticated user to view organisation details using a slug.
    /// 
    /// # Arguments
    /// 
    /// * `state` - The application state
    /// * `slug` - The slug of the organisation
    /// * `_user` - The authenticated user
    /// 
    /// # Returns
    /// 
    /// * `Result<impl IntoResponse, ChaosError>` - Organisation details or error
    pub async fn get_by_slug(
        mut transaction: DBTransaction<'_>,
        Path(slug): Path<String>,
        _user: AuthUser,
    ) -> Result<impl IntoResponse, ChaosError> {
        let org = Organisation::get_by_slug(slug, &mut transaction.tx).await?;

        transaction.tx.commit().await?;
        Ok((StatusCode::OK, Json(org)))
    }

    /// Deletes an organisation.
    /// 
    /// This handler allows super users to delete organisations.
    /// 
    /// # Arguments
    /// 
    /// * `state` - The application state
    /// * `id` - The ID of the organisation to delete
    /// * `_user` - The authenticated user (must be a super user)
    /// 
    /// # Returns
    /// 
    /// * `Result<impl IntoResponse, ChaosError>` - Success message or error
    pub async fn delete(
        mut transaction: DBTransaction<'_>,
        Path(id): Path<i64>,
        _user: SuperUser,
    ) -> Result<impl IntoResponse, ChaosError> {
        Organisation::delete(id, &mut transaction.tx).await?;

        transaction.tx.commit().await?;
        Ok((StatusCode::OK, "Successfully deleted organisation"))
    }

    /// Retrieves all admins of an organisation.
    /// 
    /// This handler allows super users to view organisation admins.
    /// 
    /// # Arguments
    /// 
    /// * `state` - The application state
    /// * `id` - The ID of the organisation
    /// * `_user` - The authenticated user (must be a super user)
    /// 
    /// # Returns
    /// 
    /// * `Result<impl IntoResponse, ChaosError>` - List of admins or error
    pub async fn get_admins(
        mut transaction: DBTransaction<'_>,
        Path(id): Path<i64>,
        _user: SuperUser,
    ) -> Result<impl IntoResponse, ChaosError> {
        let members = Organisation::get_admins(id, &mut transaction.tx).await?;

        transaction.tx.commit().await?;
        Ok((StatusCode::OK, Json(members)))
    }

    /// Retrieves all members of an organisation.
    /// 
    /// This handler allows organisation admins to view all members.
    /// 
    /// # Arguments
    /// 
    /// * `state` - The application state
    /// * `id` - The ID of the organisation
    /// * `_admin` - The authenticated user (must be an organisation admin)
    /// 
    /// # Returns
    /// 
    /// * `Result<impl IntoResponse, ChaosError>` - List of members or error
    pub async fn get_members(
        mut transaction: DBTransaction<'_>,
        Path(id): Path<i64>,
        _admin: OrganisationAdmin,
    ) -> Result<impl IntoResponse, ChaosError> {
        let members = Organisation::get_members(id, &mut transaction.tx).await?;

        transaction.tx.commit().await?;
        Ok((StatusCode::OK, Json(members)))
    }

    /// Updates the admin list of an organisation.
    /// 
    /// This handler allows super users to update organisation admins.
    /// 
    /// # Arguments
    /// 
    /// * `id` - The ID of the organisation
    /// * `_super_user` - The authenticated user (must be a super user)
    /// * `transaction` - Database transaction
    /// * `request_body` - The new admin list
    /// 
    /// # Returns
    /// 
    /// * `Result<impl IntoResponse, ChaosError>` - Success message or error
    pub async fn update_admins(
        Path(id): Path<i64>,
        _super_user: SuperUser,
        mut transaction: DBTransaction<'_>,
        Json(request_body): Json<AdminUpdateList>,
    ) -> Result<impl IntoResponse, ChaosError> {
        Organisation::update_admins(id, request_body.members, &mut transaction.tx).await?;

        transaction.tx.commit().await?;
        Ok((StatusCode::OK, "Successfully updated organisation members"))
    }

    /// Updates the member list of an organisation.
    /// 
    /// This handler allows organisation admins to update members.
    /// 
    /// # Arguments
    /// 
    /// * `transaction` - Database transaction
    /// * `id` - The ID of the organisation
    /// * `_admin` - The authenticated user (must be an organisation admin)
    /// * `request_body` - The new member list
    /// 
    /// # Returns
    /// 
    /// * `Result<impl IntoResponse, ChaosError>` - Success message or error
    pub async fn update_members(
        mut transaction: DBTransaction<'_>,
        Path(id): Path<i64>,
        _admin: OrganisationAdmin,
        Json(request_body): Json<AdminUpdateList>,
    ) -> Result<impl IntoResponse, ChaosError> {
        Organisation::update_members(id, request_body.members, &mut transaction.tx).await?;

        transaction.tx.commit().await?;
        Ok((StatusCode::OK, "Successfully updated organisation members"))
    }

    /// Removes an admin from an organisation.
    /// 
    /// This handler allows super users to remove admins.
    /// 
    /// # Arguments
    /// 
    /// * `transaction` - Database transaction
    /// * `id` - The ID of the organisation
    /// * `_super_user` - The authenticated user (must be a super user)
    /// * `request_body` - The admin to remove
    /// 
    /// # Returns
    /// 
    /// * `Result<impl IntoResponse, ChaosError>` - Success message or error
    pub async fn remove_admin(
        mut transaction: DBTransaction<'_>,
        Path(id): Path<i64>,
        _super_user: SuperUser,
        Json(request_body): Json<AdminToRemove>,
    ) -> Result<impl IntoResponse, ChaosError> {
        Organisation::remove_admin(id, request_body.user_id, &mut transaction.tx).await?;

        transaction.tx.commit().await?;
        Ok((
            StatusCode::OK,
            "Successfully removed member from organisation",
        ))
    }

    /// Removes a member from an organisation.
    /// 
    /// This handler allows organisation admins to remove members.
    /// 
    /// # Arguments
    /// 
    /// * `transaction` - Database transaction
    /// * `id` - The ID of the organisation
    /// * `_admin` - The authenticated user (must be an organisation admin)
    /// * `request_body` - The member to remove
    /// 
    /// # Returns
    /// 
    /// * `Result<impl IntoResponse, ChaosError>` - Success message or error
    pub async fn remove_member(
        mut transaction: DBTransaction<'_>,
        Path(id): Path<i64>,
        _admin: OrganisationAdmin,
        Json(request_body): Json<AdminToRemove>,
    ) -> Result<impl IntoResponse, ChaosError> {
        Organisation::remove_member(id, request_body.user_id, &mut transaction.tx).await?;

        transaction.tx.commit().await?;
        Ok((
            StatusCode::OK,
            "Successfully removed member from organisation",
        ))
    }

    /// Updates an organisation's logo.
    /// 
    /// This handler allows organisation admins to update the logo.
    /// 
    /// # Arguments
    /// 
    /// * `state` - The application state
    /// * `id` - The ID of the organisation
    /// * `_admin` - The authenticated user (must be an organisation admin)
    /// 
    /// # Returns
    /// 
    /// * `Result<impl IntoResponse, ChaosError>` - Logo URL or error
    pub async fn update_logo(
        State(state): State<AppState>,
        mut transaction: DBTransaction<'_>,
        Path(id): Path<i64>,
        _admin: OrganisationAdmin,
    ) -> Result<impl IntoResponse, ChaosError> {
        let logo_url = Organisation::update_logo(id, &mut transaction.tx, &state.storage_bucket).await?;

        transaction.tx.commit().await?;
        Ok((StatusCode::OK, Json(logo_url)))
    }

    /// Retrieves all campaigns for an organisation.
    /// 
    /// This handler allows any authenticated user to view organisation campaigns.
    /// 
    /// # Arguments
    /// 
    /// * `state` - The application state
    /// * `id` - The ID of the organisation
    /// * `_user` - The authenticated user
    /// 
    /// # Returns
    /// 
    /// * `Result<impl IntoResponse, ChaosError>` - List of campaigns or error
    pub async fn get_campaigns(
        mut transaction: DBTransaction<'_>,
        Path(id): Path<i64>,
        _user: AuthUser,
    ) -> Result<impl IntoResponse, ChaosError> {
        let campaigns = Organisation::get_campaigns(id, &mut transaction.tx).await?;

        transaction.tx.commit().await?;
        Ok((StatusCode::OK, Json(campaigns)))
    }

    /// Creates a new campaign for an organisation.
    /// 
    /// This handler allows organisation admins to create campaigns.
    /// 
    /// # Arguments
    /// 
    /// * `id` - The ID of the organisation
    /// * `state` - The application state
    /// * `_admin` - The authenticated user (must be an organisation admin)
    /// * `request_body` - The new campaign details
    /// 
    /// # Returns
    /// 
    /// * `Result<impl IntoResponse, ChaosError>` - Success message or error
    pub async fn create_campaign(
        Path(id): Path<i64>,
        State(mut state): State<AppState>,
        mut transaction: DBTransaction<'_>,
        _admin: OrganisationAdmin,
        Json(request_body): Json<NewCampaign>,
    ) -> Result<impl IntoResponse, ChaosError> {
        Organisation::create_campaign(
            id,
            request_body.slug,
            request_body.name,
            request_body.description,
            request_body.starts_at,
            request_body.ends_at,
            &mut transaction.tx,
            &mut state.snowflake_generator,
        )
        .await?;

        transaction.tx.commit().await?;
        Ok((StatusCode::OK, "Successfully created campaign"))
    }

    /// Checks if a campaign slug is available.
    /// 
    /// This handler allows organisation admins to check slug availability.
    /// 
    /// # Arguments
    /// 
    /// * `organisation_id` - The ID of the organisation
    /// * `state` - The application state
    /// * `_user` - The authenticated user (must be an organisation admin)
    /// * `data` - The slug to check
    /// 
    /// # Returns
    /// 
    /// * `Result<impl IntoResponse, ChaosError>` - Success message or error
    pub async fn check_campaign_slug_availability(
        Path(organisation_id): Path<i64>,
        mut transaction: DBTransaction<'_>,
        _user: OrganisationAdmin,
        Json(data): Json<SlugCheck>,
    ) -> Result<impl IntoResponse, ChaosError> {
        Campaign::check_slug_availability(organisation_id, data.slug, &mut transaction.tx).await?;

        transaction.tx.commit().await?;
        Ok((StatusCode::OK, "Campaign slug is available"))
    }

    /// Creates a new email template for an organisation.
    /// 
    /// This handler allows organisation admins to create email templates.
    /// 
    /// # Arguments
    /// 
    /// * `id` - The ID of the organisation
    /// * `state` - The application state
    /// * `_admin` - The authenticated user (must be an organisation admin)
    /// * `request_body` - The new template details
    /// 
    /// # Returns
    /// 
    /// * `Result<impl IntoResponse, ChaosError>` - Success message or error
    pub async fn create_email_template(
        Path(id): Path<i64>,
        State(mut state): State<AppState>,
        mut transaction: DBTransaction<'_>,
        _admin: OrganisationAdmin,
        Json(request_body): Json<NewEmailTemplate>,
    ) -> Result<impl IntoResponse, ChaosError> {
        Organisation::create_email_template(
            id,
            request_body.name,
            request_body.template_subject,
            request_body.template_body,
            &mut transaction.tx,
            &mut state.snowflake_generator,
        )
        .await?;

        transaction.tx.commit().await?;
        Ok((StatusCode::OK, "Successfully created email template"))
    }

    /// Retrieves all email templates for an organisation.
    /// 
    /// This handler allows organisation admins to view all email templates.
    /// 
    /// # Arguments
    /// 
    /// * `_user` - The authenticated user (must be an organisation admin)
    /// * `id` - The ID of the organisation
    /// * `state` - The application state
    /// 
    /// # Returns
    /// 
    /// * `Result<impl IntoResponse, ChaosError>` - List of email templates or error
    pub async fn get_all_email_templates(
        _user: OrganisationAdmin,
        Path(id): Path<i64>,
        mut transaction: DBTransaction<'_>,
    ) -> Result<impl IntoResponse, ChaosError> {
        let email_templates = EmailTemplate::get_all_by_organisation(id, &mut transaction.tx).await?;

        transaction.tx.commit().await?;
        Ok((StatusCode::OK, Json(email_templates)))
    }
}
