//! Organisation handler for the Chaos application.
//!
//! This module provides HTTP request handlers for managing organisations, including:
//! - Organisation CRUD operations
//! - Member and admin management
//! - Campaign management
//! - Email template management
//! - Logo image handling

use crate::models::app::{AppMessage, AppState, IdMessage};
use crate::models::campaign::{Campaign, NewCampaign};
use crate::models::email_template::{EmailTemplate, NewEmailTemplate};
use crate::models::error::ChaosError;
use crate::models::organisation::{
    AdminUpdateList, MemberRoleUpdate, MemberToInvite, MemberToRemove, NewOrganisation,
    Organisation, OrganisationRole, SlugCheck,
};
use crate::models::transaction::DBTransaction;
use crate::service::auth::assert_is_super_user;
use crate::spicedb;
use crate::spicedb::policies::{ManageOrganisation, ManagePlatform, UsePlatform};
use crate::spicedb::{schema as spicedb_schema, SpiceDbAuth};
use axum::extract::{Json, Path, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;
use serde_json::json;

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
        _auth: SpiceDbAuth<ManagePlatform>,
        mut transaction: DBTransaction<'_>,
        Json(data): Json<NewOrganisation>,
    ) -> Result<impl IntoResponse, ChaosError> {
        let organisation_id = Organisation::create(
            data.admin,
            data.slug,
            data.name,
            data.contact_email,
            data.website_url,
            &mut state.snowflake_generator,
            &mut transaction.tx,
        )
        .await?;

        transaction.create_spicedb_relationship(
            spicedb_schema::resource::ORGANISATION,
            organisation_id,
            spicedb_schema::relation::organisation::ADMIN,
            spicedb_schema::resource::USER,
            data.admin,
        );

        transaction.create_spicedb_relationship(
            spicedb_schema::resource::ORGANISATION,
            organisation_id,
            spicedb_schema::relation::organisation::PLATFORM,
            spicedb_schema::resource::PLATFORM,
            spicedb_schema::PLATFORM_RESOURCE_ID,
        );

        transaction.commit().await?;
        Ok(AppMessage::OkMessage("Successfully created organisation"))
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
        _auth: SpiceDbAuth<ManagePlatform>,
        Json(data): Json<SlugCheck>,
    ) -> Result<impl IntoResponse, ChaosError> {
        Organisation::check_slug_availability(data.slug, &mut transaction.tx).await?;

        transaction.commit().await?;
        Ok(AppMessage::OkMessage("Organisation slug is available"))
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
        _auth: SpiceDbAuth<UsePlatform>,
    ) -> Result<impl IntoResponse, ChaosError> {
        let org = Organisation::get(id, &mut transaction.tx).await?;
        transaction.commit().await?;
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
        _auth: SpiceDbAuth<UsePlatform>,
    ) -> Result<impl IntoResponse, ChaosError> {
        let org = Organisation::get_by_slug(slug, &mut transaction.tx).await?;

        transaction.commit().await?;
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
        _auth: SpiceDbAuth<ManagePlatform>,
        state: State<AppState>,
    ) -> Result<impl IntoResponse, ChaosError> {
        Organisation::delete(id, &mut transaction.tx).await?;

        transaction.commit().await?;

        // Run SpiceDB delete after Postgres succeeds
        spicedb::delete_all_resource_relationships(
            &state.spicedb,
            &state.spicedb_key,
            spicedb_schema::resource::ORGANISATION,
            id,
        )
        .await?;

        // TODO: SpiceDB deep delete

        Ok(AppMessage::OkMessage("Successfully deleted organisation"))
    }

    /// Get all organisations that the logged-in user is a Member of
    /// If user is Super User, get all organisations
    pub async fn get_all_for_user(
        mut transaction: DBTransaction<'_>,
        auth: SpiceDbAuth<UsePlatform>,
    ) -> Result<impl IntoResponse, ChaosError> {
        // Check if user is Super User
        let orgs = match assert_is_super_user(auth.user_id, &mut transaction.tx).await {
            Ok(_) => {
                // Is Super User
                Ok(Organisation::get_all(&mut transaction.tx).await?)
            }
            Err(ChaosError::Unauthorized) => {
                // Not a Super User
                Ok(Organisation::get_by_member(auth.user_id, &mut transaction.tx).await?)
            }
            Err(e) => Err(e),
        }?;

        transaction.commit().await?;
        Ok((StatusCode::OK, Json(orgs)))
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
        _auth: SpiceDbAuth<ManagePlatform>,
    ) -> Result<impl IntoResponse, ChaosError> {
        let members = Organisation::get_admins(id, &mut transaction.tx).await?;

        transaction.commit().await?;
        Ok((StatusCode::OK, Json(members)))
    }

    /// Retrieves all users (role) of an organisation.
    ///
    /// This handler allows organisation admins to view all members with the role "User".
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
    pub async fn get_users(
        mut transaction: DBTransaction<'_>,
        auth: SpiceDbAuth<ManageOrganisation>,
    ) -> Result<impl IntoResponse, ChaosError> {
        let members = Organisation::get_users(auth.resource_id, &mut transaction.tx).await?;

        transaction.commit().await?;
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
        auth: SpiceDbAuth<ManageOrganisation>,
    ) -> Result<impl IntoResponse, ChaosError> {
        let members = Organisation::get_members(auth.resource_id, &mut transaction.tx).await?;

        transaction.commit().await?;
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
        _auth: SpiceDbAuth<ManagePlatform>,
        mut transaction: DBTransaction<'_>,
        Json(request_body): Json<AdminUpdateList>,
    ) -> Result<impl IntoResponse, ChaosError> {
        let deleted_members =
            Organisation::update_admins(id, request_body.members.clone(), &mut transaction.tx)
                .await?;

        for deleted_member in deleted_members {
            transaction.delete_spicedb_relationship(
                spicedb_schema::resource::ORGANISATION,
                id,
                spicedb_schema::relation::organisation::ADMIN,
                spicedb_schema::resource::USER,
                deleted_member,
            );
        }

        for new_member in request_body.members {
            transaction.create_spicedb_relationship(
                spicedb_schema::resource::ORGANISATION,
                id,
                spicedb_schema::relation::organisation::ADMIN,
                spicedb_schema::resource::USER,
                new_member,
            );
        }

        transaction.commit().await?;
        Ok(AppMessage::OkMessage(
            "Successfully updated organisation members",
        ))
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
        auth: SpiceDbAuth<ManageOrganisation>,
        Json(request_body): Json<AdminUpdateList>,
    ) -> Result<impl IntoResponse, ChaosError> {
        let deleted_members = Organisation::update_members(
            auth.resource_id,
            request_body.members.clone(),
            &mut transaction.tx,
        )
        .await?;

        for deleted_member in deleted_members {
            transaction.delete_spicedb_relationship(
                spicedb_schema::resource::ORGANISATION,
                auth.resource_id,
                spicedb_schema::relation::organisation::MEMBER,
                spicedb_schema::resource::USER,
                deleted_member,
            );
        }

        for new_member in request_body.members {
            transaction.create_spicedb_relationship(
                spicedb_schema::resource::ORGANISATION,
                auth.resource_id,
                spicedb_schema::relation::organisation::MEMBER,
                spicedb_schema::resource::USER,
                new_member,
            );
        }

        transaction.commit().await?;
        Ok(AppMessage::OkMessage(
            "Successfully updated organisation members",
        ))
    }

    /// Updates a single member's role (promote to Admin or demote to User). Superusers only.
    pub async fn update_member(
        mut transaction: DBTransaction<'_>,
        Path(id): Path<i64>,
        _auth: SpiceDbAuth<ManagePlatform>,
        Json(request_body): Json<MemberRoleUpdate>,
    ) -> Result<impl IntoResponse, ChaosError> {
        let old_role = Organisation::update_member_role(
            id,
            request_body.user_id,
            request_body.role,
            &mut transaction.tx,
        )
        .await?;

        transaction.delete_spicedb_relationship(
            spicedb_schema::resource::ORGANISATION,
            id,
            old_role.convert_to_spicedb(),
            spicedb_schema::resource::USER,
            request_body.user_id,
        );

        transaction.create_spicedb_relationship(
            spicedb_schema::resource::ORGANISATION,
            id,
            request_body.role.convert_to_spicedb(),
            spicedb_schema::resource::USER,
            request_body.user_id,
        );

        transaction.commit().await?;
        Ok(AppMessage::OkMessage("Successfully updated member role"))
    }

    /// Removes an admin from an organisation.
    ///
    /// This handler allows super users to remove admins. This demotes
    /// them to an [`OrganisationRole::User`], but does not remove
    /// them from the organisation.
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
        _auth: SpiceDbAuth<ManagePlatform>,
        Json(request_body): Json<MemberToRemove>,
    ) -> Result<impl IntoResponse, ChaosError> {
        Organisation::remove_admin(id, request_body.user_id, &mut transaction.tx).await?;

        transaction.delete_spicedb_relationship(
            spicedb_schema::resource::ORGANISATION,
            id,
            OrganisationRole::Admin.convert_to_spicedb(),
            spicedb_schema::resource::USER,
            request_body.user_id,
        );

        transaction.create_spicedb_relationship(
            spicedb_schema::resource::ORGANISATION,
            id,
            OrganisationRole::User.convert_to_spicedb(),
            spicedb_schema::resource::USER,
            request_body.user_id,
        );

        transaction.commit().await?;
        Ok(AppMessage::OkMessage(
            "Successfully removed member from organisation",
        ))
    }

    /// Removes a user from an organisation.
    ///
    /// This handler allows organisation admins to remove members with role "User".
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
    pub async fn remove_user(
        mut transaction: DBTransaction<'_>,
        auth: SpiceDbAuth<ManageOrganisation>,
        Json(request_body): Json<MemberToRemove>,
    ) -> Result<impl IntoResponse, ChaosError> {
        Organisation::remove_user(auth.resource_id, request_body.user_id, &mut transaction.tx)
            .await?;

        // Can only remove users with role "User", so no need to worry about removing admin
        transaction.delete_spicedb_relationship(
            spicedb_schema::resource::ORGANISATION,
            auth.resource_id,
            OrganisationRole::User.convert_to_spicedb(),
            spicedb_schema::resource::USER,
            request_body.user_id,
        );

        transaction.commit().await?;
        Ok(AppMessage::OkMessage(
            "Successfully removed member from organisation",
        ))
    }

    pub async fn invite_user(
        mut transaction: DBTransaction<'_>,
        auth: SpiceDbAuth<ManageOrganisation>,
        State(mut state): State<AppState>,
        Json(request_body): Json<MemberToInvite>,
    ) -> Result<impl IntoResponse, ChaosError> {
        let (invite_code, added_user) = Organisation::invite_user(
            auth.resource_id,
            auth.user_id,
            request_body.email,
            state.email_credentials.clone(),
            state.is_dev_env,
            &mut state.snowflake_generator,
            &mut transaction.tx,
        )
        .await?;

        // An existing user was added so we need to add the relationship into SpiceDB
        if let Some(user_id) = added_user {
            transaction.create_spicedb_relationship(
                spicedb_schema::resource::ORGANISATION,
                auth.resource_id,
                OrganisationRole::User.convert_to_spicedb(),
                spicedb_schema::resource::USER,
                user_id,
            );
        }

        transaction.commit().await?;
        Ok(AppMessage::OkMessage(invite_code))
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
        auth: SpiceDbAuth<ManageOrganisation>,
    ) -> Result<impl IntoResponse, ChaosError> {
        let logo_url =
            Organisation::update_logo(auth.resource_id, &mut transaction.tx, &state.storage_bucket)
                .await?;

        transaction.commit().await?;
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
        _auth: SpiceDbAuth<UsePlatform>,
    ) -> Result<impl IntoResponse, ChaosError> {
        let campaigns = Organisation::get_campaigns(id, &mut transaction.tx).await?;

        transaction.commit().await?;
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
        State(mut state): State<AppState>,
        mut transaction: DBTransaction<'_>,
        auth: SpiceDbAuth<ManageOrganisation>,
        Json(request_body): Json<NewCampaign>,
    ) -> Result<impl IntoResponse, ChaosError> {
        let new_campaign_id = Organisation::create_campaign(
            auth.resource_id,
            request_body.slug,
            request_body.name,
            request_body.description,
            request_body.starts_at,
            request_body.ends_at,
            request_body.interview_period_starts_at,
            request_body.interview_period_ends_at,
            request_body.interview_format,
            request_body.outcomes_released_at,
            request_body.application_requirements,
            &mut transaction.tx,
            &mut state.snowflake_generator,
        )
        .await?;

        transaction.create_spicedb_relationship(
            spicedb_schema::resource::CAMPAIGN,
            new_campaign_id,
            spicedb_schema::relation::campaign::ORGANISATION,
            spicedb_schema::resource::ORGANISATION,
            auth.resource_id,
        );

        transaction.commit().await?;
        Ok((
            StatusCode::OK,
            Json(IdMessage {
                id: new_campaign_id,
            }),
        ))
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
        mut transaction: DBTransaction<'_>,
        auth: SpiceDbAuth<ManageOrganisation>,
        Json(data): Json<SlugCheck>,
    ) -> Result<impl IntoResponse, ChaosError> {
        Campaign::check_slug_availability(auth.resource_id, data.slug, &mut transaction.tx).await?;

        transaction.commit().await?;
        Ok(AppMessage::OkMessage("Campaign slug is available"))
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
        State(mut state): State<AppState>,
        mut transaction: DBTransaction<'_>,
        auth: SpiceDbAuth<ManageOrganisation>,
        Json(request_body): Json<NewEmailTemplate>,
    ) -> Result<impl IntoResponse, ChaosError> {
        let template_id = Organisation::create_email_template(
            auth.resource_id,
            request_body.name,
            request_body.template_subject,
            request_body.template_body,
            &mut transaction.tx,
            &mut state.snowflake_generator,
        )
        .await?;

        transaction.create_spicedb_relationship(
            spicedb_schema::resource::EMAIL_TEMPLATE,
            template_id,
            spicedb_schema::relation::email_template::ORGANISATION,
            spicedb_schema::resource::ORGANISATION,
            auth.resource_id,
        );

        transaction.commit().await?;
        Ok(AppMessage::OkMessage("Successfully created email template"))
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
        auth: SpiceDbAuth<ManageOrganisation>,
        mut transaction: DBTransaction<'_>,
    ) -> Result<impl IntoResponse, ChaosError> {
        let email_templates =
            EmailTemplate::get_all_by_organisation(auth.resource_id, &mut transaction.tx).await?;

        transaction.commit().await?;
        Ok((StatusCode::OK, Json(email_templates)))
    }

    pub async fn get_user_role(
        auth: SpiceDbAuth<UsePlatform>,
        Path(id): Path<i64>,
        mut transaction: DBTransaction<'_>,
    ) -> Result<impl IntoResponse, ChaosError> {
        let role = Organisation::get_user_role(id, auth.user_id, &mut transaction.tx).await?;

        transaction.commit().await?;
        Ok((StatusCode::OK, Json(json!({ "role": role }))))
    }
}
