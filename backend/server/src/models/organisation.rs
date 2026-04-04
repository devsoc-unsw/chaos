//! Organisation management for Chaos.
//!
//! This module provides functionality for managing organisations in the system,
//! including creation, updates, member management, and campaign creation.

use crate::constants::NANOID_ALPHABET;
use crate::models::campaign::OrganisationCampaign;
use crate::models::email::ChaosEmail;
use crate::models::email::EmailCredentials;
use crate::models::error::ChaosError;
use crate::models::storage::Storage;
use crate::models::user::User;
use crate::service::campaign::create_proper_slug;
use chrono::{DateTime, Duration, Utc};
use nanoid::nanoid;
use s3::Bucket;
use serde::{Deserialize, Serialize};
use snowflake::SnowflakeIdGenerator;
use sqlx::{FromRow, Postgres, Transaction};
use std::ops::DerefMut;
use uuid::Uuid;

/// Represents an organisation in the database.
///
/// An organisation is a group that can run recruitment campaigns
/// and manage its members and administrators.
#[derive(Deserialize, Serialize, Clone, FromRow, Debug)]
pub struct Organisation {
    /// Unique identifier for the organisation
    #[serde(serialize_with = "crate::models::serde_string::serialize")]
    pub id: i64,
    /// URL-friendly identifier for the organisation
    pub slug: String,
    /// Display name of the organisation
    pub name: String,
    /// Optional UUID of the organisation's logo
    pub logo: Option<Uuid>,
    /// When the organisation was created
    pub created_at: DateTime<Utc>,
    /// When the organisation was last updated
    pub updated_at: DateTime<Utc>,
    /// The organisation's contact email (e.g. contact@devsoc.app)
    pub contact_email: String,
    /// The organisations website link (e.g. https://devsoc.app)
    pub website_url: Option<String>,
    /// List of campaigns run by this organisation
    pub campaigns: Vec<OrganisationCampaign>, // Awaiting Campaign to be complete - remove comment once done
    /// List of user IDs who are administrators of this organisation
    #[serde(serialize_with = "crate::models::serde_string::serialize_vec")]
    pub organisation_admins: Vec<i64>,
}

/// Data structure for creating a new organisation.
///
/// This struct contains the fields needed to create a new organisation,
/// including the initial administrator.
#[derive(Deserialize, Serialize)]
pub struct NewOrganisation {
    /// URL-friendly identifier for the organisation
    pub slug: String,
    /// Display name of the organisation
    pub name: String,
    /// ID of the user who will be the initial administrator
    pub admin: i64,
    /// The organisation's contact email (e.g. contact@devsoc.app)
    pub contact_email: String,
    /// The organisations website link (e.g. https://devsoc.app)
    pub website_url: Option<String>,
}

/// Detailed view of an organisation's information.
///
/// This struct provides a complete view of an organisation's details,
/// used primarily for API responses.
#[derive(Deserialize, Serialize)]
pub struct OrganisationDetails {
    /// Unique identifier for the organisation
    #[serde(serialize_with = "crate::models::serde_string::serialize")]
    pub id: i64,
    /// URL-friendly identifier for the organisation
    pub slug: String,
    /// Display name of the organisation
    pub name: String,
    /// Optional UUID of the organisation's logo
    pub logo: Option<Uuid>,
    /// When the organisation was created
    pub created_at: DateTime<Utc>,
    /// The organisation's contact email (e.g. contact@devsoc.app)
    pub contact_email: String,
    /// The organisations website link (e.g. https://devsoc.app)
    pub website_url: Option<String>,
}

/// Possible roles for organisation members.
///
/// This enum represents the different roles a user can have
/// within an organisation.
#[derive(Deserialize, Serialize, sqlx::Type, Clone)]
#[sqlx(type_name = "organisation_role", rename_all = "PascalCase")]
pub enum OrganisationRole {
    /// Regular member with basic access
    User,
    /// Administrator with full access
    Admin,
}

/// Represents a member of an organisation.
///
/// This struct contains information about a user's membership
/// in an organisation, including their role.
#[derive(Deserialize, Serialize, FromRow)]
pub struct Member {
    /// ID of the user
    #[serde(serialize_with = "crate::models::serde_string::serialize")]
    pub id: i64,
    /// Name of the user
    pub name: String,
    /// Email of the user
    pub email: String,
    /// User's role in the organisation
    pub role: OrganisationRole,
}

/// Data structure for updating organisation administrators.
///
/// This struct contains a list of user IDs who should be
/// administrators of the organisation.
#[derive(Deserialize, Serialize)]
pub struct AdminUpdateList {
    /// List of user IDs to be administrators
    #[serde(deserialize_with = "crate::models::serde_string::deserialize_vec")]
    pub members: Vec<i64>,
}

/// Data structure for removing an administrator.
///
/// This struct contains the ID of the user to remove
/// from the administrator role.
#[derive(Deserialize)]
pub struct MemberToRemove {
    /// ID of the user to remove as administrator
    #[serde(deserialize_with = "crate::models::serde_string::deserialize")]
    pub user_id: i64,
}

/// Data structure for updating a single member's role (promote or demote).
#[derive(Deserialize)]
pub struct MemberRoleUpdate {
    #[serde(deserialize_with = "crate::models::serde_string::deserialize")]
    pub user_id: i64,
    pub role: OrganisationRole,
}

#[derive(Deserialize)]
pub struct MemberToInvite {
    pub email: String,
}

/// Data structure for checking slug availability.
///
/// This struct contains a user's email, and the role for that user.
#[derive(Deserialize, Serialize)]
pub struct EmailRoleBody {
    // email
    pub email: String,
    // role
    pub role: OrganisationRole,
}

/// Data structure for passing in a user's email
///
/// This struct contains a user's email
#[derive(Deserialize, Serialize)]
pub struct EmailBody {
    // email
    pub email: String,
}

/// Data structure for passing in a user's email
///
/// This struct contains a user's email
#[derive(Deserialize, Serialize)]
pub struct IdBody {
    // email
    #[serde(deserialize_with = "crate::models::serde_string::deserialize")]
    pub user_id: i64,
}

/// Data structure for passing in a user's email and role
///
/// This struct contains a user's email
#[derive(Deserialize, Serialize)]
pub struct IdRoleBody {
    // email
    #[serde(deserialize_with = "crate::models::serde_string::deserialize")]
    pub user_id: i64,
    pub role: OrganisationRole,
}

/// This struct contains a slug to check for availability
/// when creating a new organisation.
#[derive(Deserialize)]
pub struct SlugCheck {
    /// The slug to check
    pub slug: String,
}

impl Organisation {
    /// Creates a new organisation.
    ///
    /// # Arguments
    /// * `admin_id` - The ID of the user who will be the initial administrator
    /// * `slug` - The URL-friendly identifier for the organisation
    /// * `name` - The display name of the organisation
    /// * `snowflake_generator` - A generator for creating unique IDs
    /// * `transaction` - A mutable reference to the database transaction
    ///
    /// # Returns
    /// Returns a `Result` containing either:
    /// * `Ok(())` - If the organisation was created successfully
    /// * `Err(ChaosError)` - An error if creation fails
    ///
    /// # Note
    /// The slug must be ASCII-only.
    pub async fn create(
        admin_id: i64,
        mut slug: String,
        name: String,
        contact_email: String,
        website_url: Option<String>,
        snowflake_generator: &mut SnowflakeIdGenerator,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<i64, ChaosError> {
        if !slug.is_ascii() {
            return Err(ChaosError::BadRequest);
        }

        slug = create_proper_slug(&slug);

        let id = snowflake_generator.real_time_generate();

        sqlx::query!(
            "
            INSERT INTO organisations (id, slug, name, contact_email, website_url)
                VALUES ($1, $2, $3, $4, $5)
        ",
            id,
            slug.to_lowercase(),
            name,
            contact_email,
            website_url
        )
        .execute(transaction.deref_mut())
        .await?;

        sqlx::query!(
            "
            INSERT INTO organisation_members (organisation_id, user_id, role)
                VALUES ($1, $2, $3)
        ",
            id,
            admin_id,
            OrganisationRole::Admin as OrganisationRole
        )
        .execute(transaction.deref_mut())
        .await?;

        Ok(id)
    }

    /// Checks if a slug is available for use.
    ///
    /// # Arguments
    /// * `slug` - The slug to check
    /// * `pool` - A reference to the database connection pool
    ///
    /// # Returns
    /// Returns a `Result` containing either:
    /// * `Ok(())` - If the slug is available
    /// * `Err(ChaosError)` - If the slug is invalid or already in use
    ///
    /// # Note
    /// The slug must be ASCII-only.
    pub async fn check_slug_availability(
        mut slug: String,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<(), ChaosError> {
        if !slug.is_ascii() {
            return Err(ChaosError::BadRequest);
        }

        slug = create_proper_slug(&slug);

        let exists = sqlx::query!(
            "
                SELECT EXISTS(SELECT 1 FROM organisations WHERE slug = $1)
            ",
            slug
        )
        .fetch_one(transaction.deref_mut())
        .await?
        .exists
        .expect("`exists` should always exist in this query result");

        if exists {
            return Err(ChaosError::BadRequest);
        }

        Ok(())
    }

    /// Retrieves an organisation by its ID.
    ///
    /// # Arguments
    /// * `id` - The ID of the organisation to retrieve
    /// * `pool` - A reference to the database connection pool
    ///
    /// # Returns
    /// Returns a `Result` containing either:
    /// * `Ok(OrganisationDetails)` - The requested organisation details
    /// * `Err(ChaosError)` - An error if retrieval fails
    pub async fn get(
        id: i64,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<OrganisationDetails, ChaosError> {
        let organisation = sqlx::query_as!(
            OrganisationDetails,
            "
            SELECT id, slug, name, logo, created_at, website_url, contact_email
                FROM organisations
                WHERE id = $1
        ",
            id
        )
        .fetch_one(transaction.deref_mut())
        .await?;

        Ok(organisation)
    }

    pub async fn get_all(
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<Vec<OrganisationDetails>, ChaosError> {
        let organisations = sqlx::query_as!(
            OrganisationDetails,
            "
            SELECT id, slug, name, logo, created_at, website_url, contact_email
                FROM organisations
        ",
        )
        .fetch_all(transaction.deref_mut())
        .await?;

        Ok(organisations)
    }

    /// Retrieves an organisation by its slug.
    ///
    /// # Arguments
    /// * `slug` - The slug of the organisation to retrieve
    /// * `pool` - A reference to the database connection pool
    ///
    /// # Returns
    /// Returns a `Result` containing either:
    /// * `Ok(OrganisationDetails)` - The requested organisation details
    /// * `Err(ChaosError)` - An error if retrieval fails
    pub async fn get_by_slug(
        slug: String,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<OrganisationDetails, ChaosError> {
        let organisation = sqlx::query_as!(
            OrganisationDetails,
            "
            SELECT id, slug, name, logo, created_at, website_url, contact_email
                FROM organisations
                WHERE slug = $1
        ",
            slug
        )
        .fetch_one(transaction.deref_mut())
        .await?;

        Ok(organisation)
    }

    /// Retrieves all organisations that a user is a member of.
    ///
    /// # Arguments
    /// * `user_id` - The ID of the user to retrieve organisations for
    /// * `transaction` - A mutable reference to the database transaction
    ///
    /// # Returns
    /// Returns a `Result` containing either:
    /// * `Ok(Vec<OrganisationDetails>)` - The requested organisations
    /// * `Err(ChaosError)` - An error if retrieval fails
    pub async fn get_by_member(
        user_id: i64,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<Vec<OrganisationDetails>, ChaosError> {
        let orgs = sqlx::query_as!(
            OrganisationDetails,
            "
            SELECT o.id, o.slug, o.name, o.logo, o.created_at, o.website_url, o.contact_email
                    FROM organisations o
                    JOIN organisation_members om
                    ON o.id = om.organisation_id
                    WHERE om.user_id = $1
            ",
            user_id
        )
        .fetch_all(transaction.deref_mut())
        .await?;

        Ok(orgs)
    }

    /// Deletes an organisation.
    ///
    /// # Arguments
    /// * `id` - The ID of the organisation to delete
    /// * `pool` - A reference to the database connection pool
    ///
    /// # Returns
    /// Returns a `Result` containing either:
    /// * `Ok(())` - If the organisation was deleted successfully
    /// * `Err(ChaosError)` - An error if deletion fails
    pub async fn delete(
        id: i64,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<(), ChaosError> {
        _ = sqlx::query!(
            "
            DELETE FROM organisations WHERE id = $1 RETURNING id
        ",
            id
        )
        .fetch_one(transaction.deref_mut())
        .await?;

        Ok(())
    }

    /// Retrieves all administrators of an organisation.
    ///
    /// # Arguments
    /// * `organisation_id` - The ID of the organisation
    /// * `pool` - A reference to the database connection pool
    ///
    /// # Returns
    /// Returns a `Result` containing either:
    /// * `Ok(MemberList)` - List of administrators
    /// * `Err(ChaosError)` - An error if retrieval fails
    pub async fn get_admins(
        organisation_id: i64,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<Vec<Member>, ChaosError> {
        let admin_list = sqlx::query_as!(
        Member,
        "
            SELECT organisation_members.user_id as id, organisation_members.role AS \"role: OrganisationRole\", users.name, users.email from organisation_members
                JOIN users on users.id = organisation_members.user_id
                WHERE organisation_members.organisation_id = $1 AND organisation_members.role = $2
                ORDER BY organisation_members.id
        ",
        organisation_id,
            OrganisationRole::Admin as OrganisationRole
    )
            .fetch_all(transaction.deref_mut())
            .await?;

        Ok(admin_list)
    }

    /// Retrieves all users of an organisation.
    ///
    /// # Arguments
    /// * `organisation_id` - The ID of the organisation
    /// * `pool` - A reference to the database connection pool
    ///
    /// # Returns
    /// Returns a `Result` containing either:
    /// * `Ok(MemberList)` - List of all members with role "User"
    /// * `Err(ChaosError)` - An error if retrieval fails
    pub async fn get_users(
        organisation_id: i64,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<Vec<Member>, ChaosError> {
        let admin_list = sqlx::query_as!(
        Member,
        "
            SELECT organisation_members.user_id as id, organisation_members.role AS \"role: OrganisationRole\", users.name, users.email from organisation_members
                JOIN users on users.id = organisation_members.user_id
                WHERE organisation_members.organisation_id = $1 AND organisation_members.role = $2
                ORDER BY organisation_members.id
        ",
        organisation_id,
            OrganisationRole::User as OrganisationRole
    )
            .fetch_all(transaction.deref_mut())
            .await?;

        Ok(admin_list)
    }

    /// Retrieves all members of an organisation.
    ///
    /// # Arguments
    /// * `organisation_id` - The ID of the organisation
    /// * `pool` - A reference to the database connection pool
    ///
    /// # Returns
    /// Returns a `Result` containing either:
    /// * `Ok(MemberList)` - List of all members
    /// * `Err(ChaosError)` - An error if retrieval fails
    pub async fn get_members(
        organisation_id: i64,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<Vec<Member>, ChaosError> {
        let admin_list = sqlx::query_as!(
        Member,
        "
            SELECT organisation_members.user_id as id, organisation_members.role AS \"role: OrganisationRole\", users.name, users.email from organisation_members
                JOIN users on users.id = organisation_members.user_id
                WHERE organisation_members.organisation_id = $1
                ORDER BY organisation_members.id
        ",
        organisation_id
    )
            .fetch_all(transaction.deref_mut())
            .await?;

        Ok(admin_list)
    }

    /// Updates the list of administrators for an organisation.
    ///
    /// # Arguments
    /// * `organisation_id` - The ID of the organisation
    /// * `admin_id_list` - List of user IDs to be administrators
    /// * `transaction` - A mutable reference to the database transaction
    ///
    /// # Returns
    /// Returns a `Result` containing either:
    /// * `Ok(())` - If the administrators were updated successfully
    /// * `Err(ChaosError)` - An error if update fails
    pub async fn update_admins(
        organisation_id: i64,
        admin_id_list: Vec<i64>,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<(), ChaosError> {
        // TODO: If we allow admins to add other admins
        // if !admin_id_list.contains(&current_user_id) {
        //     return Err(
        //         ChaosError::BadRequestWithMessage(
        //             "Cannot have an admin list without current user. Ask another admin to remove yourself."
        //             .to_string()
        //         )
        //     )
        // }

        let _ = sqlx::query!(
            "SELECT id FROM organisations WHERE id = $1",
            organisation_id
        )
        .fetch_one(transaction.deref_mut())
        .await?;

        sqlx::query!(
            "DELETE FROM organisation_members WHERE organisation_id = $1 AND role = $2",
            organisation_id,
            OrganisationRole::Admin as OrganisationRole
        )
        .execute(transaction.deref_mut())
        .await?;

        for admin_id in admin_id_list {
            sqlx::query!(
                "
                INSERT INTO organisation_members (organisation_id, user_id, role)
                    VALUES ($1, $2, $3)
            ",
                organisation_id,
                admin_id,
                OrganisationRole::Admin as OrganisationRole
            )
            .execute(transaction.deref_mut())
            .await?;
        }

        Ok(())
    }

    /// Updates the list of members for an organisation.
    ///
    /// # Arguments
    /// * `organisation_id` - The ID of the organisation
    /// * `member_id_list` - List of user IDs to be members
    /// * `transaction` - A mutable reference to the database transaction
    ///
    /// # Returns
    /// Returns a `Result` containing either:
    /// * `Ok(())` - If the members were updated successfully
    /// * `Err(ChaosError)` - An error if update fails
    pub async fn update_members(
        organisation_id: i64,
        member_id_list: Vec<i64>,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<(), ChaosError> {
        let _ = sqlx::query!(
            "SELECT id FROM organisations WHERE id = $1",
            organisation_id
        )
        .fetch_one(transaction.deref_mut())
        .await?;

        sqlx::query!(
            "DELETE FROM organisation_members WHERE organisation_id = $1 AND role = $2",
            organisation_id,
            OrganisationRole::User as OrganisationRole
        )
        .execute(transaction.deref_mut())
        .await?;

        for member_id in member_id_list {
            sqlx::query!(
                "
                INSERT INTO organisation_members (organisation_id, user_id, role)
                    VALUES ($1, $2, $3)
            ",
                organisation_id,
                member_id,
                OrganisationRole::User as OrganisationRole
            )
            .execute(transaction.deref_mut())
            .await?;
        }

        Ok(())
    }

    pub async fn remove_admin(
        organisation_id: i64,
        admin_to_remove: i64,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<(), ChaosError> {
        Self::update_member_role(
            organisation_id,
            admin_to_remove,
            OrganisationRole::User,
            transaction,
        )
        .await
    }

    /// Updates a single member's role (promote to Admin or demote to User). The user must already be in the organisation.
    pub async fn update_member_role(
        organisation_id: i64,
        user_id: i64,
        role: OrganisationRole,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<(), ChaosError> {
        let _ = sqlx::query!(
            "SELECT id FROM organisations WHERE id = $1",
            organisation_id
        )
        .fetch_one(transaction.deref_mut())
        .await?;

        sqlx::query!(
            "
            UPDATE organisation_members SET role = $3 WHERE user_id = $1 AND organisation_id = $2
        ",
            user_id,
            organisation_id,
            role as OrganisationRole
        )
        .execute(transaction.deref_mut())
        .await?;

        Ok(())
    }

    pub async fn remove_user(
        organisation_id: i64,
        user_id: i64,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<(), ChaosError> {
        let _ = sqlx::query!(
            "SELECT id FROM organisations WHERE id = $1",
            organisation_id
        )
        .fetch_one(transaction.deref_mut())
        .await?;

        sqlx::query!(
            "
            DELETE FROM organisation_members WHERE user_id = $1 AND organisation_id = $2 AND role = $3
        ",
            user_id,
            organisation_id,
            OrganisationRole::User as OrganisationRole
        )
        .execute(transaction.deref_mut())
        .await?;

        Ok(())
    }

    pub async fn add_user(
        organisation_id: i64,
        user_id: i64,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<(), ChaosError> {
        let _ = sqlx::query!(
            "SELECT id FROM organisations WHERE id = $1",
            organisation_id
        )
        .fetch_one(transaction.deref_mut())
        .await?;

        sqlx::query!(
            "
                INSERT INTO organisation_members (organisation_id, user_id, role)
                    VALUES ($1, $2, $3)
            ",
            organisation_id,
            user_id,
            OrganisationRole::User as OrganisationRole
        )
        .execute(transaction.deref_mut())
        .await?;

        Ok(())
    }

    async fn check_user_already_member(
        organisation_id: i64,
        user_id: i64,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<bool, ChaosError> {
        let possible_user = sqlx::query!(
            "
                SELECT id FROM organisation_members WHERE organisation_id = $1 AND user_id = $2
            ",
            organisation_id,
            user_id
        )
        .fetch_optional(transaction.deref_mut())
        .await?;

        match possible_user {
            Some(_) => Ok(true),
            None => Ok(false),
        }
    }

    pub async fn invite_user(
        organisation_id: i64,
        inviting_user_id: i64,
        email: String,
        email_credentials: EmailCredentials,
        is_dev_env: bool,
        snowflake_generator: &mut SnowflakeIdGenerator,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<String, ChaosError> {
        let email = email.to_lowercase();

        let _ = sqlx::query!(
            "SELECT id FROM organisations WHERE id = $1",
            organisation_id
        )
        .fetch_one(transaction.deref_mut())
        .await?;

        let possible_user = User::find_by_email(email.clone(), transaction).await?;
        if let Some(user) = possible_user {
            if Self::check_user_already_member(organisation_id, user.id, transaction).await? {
                return Err(ChaosError::BadRequestWithMessage(
                    "User already a member of organisation".to_string(),
                ));
            }
            Self::add_user(organisation_id, user.id, transaction).await?;
            return Ok("existing-user-added".to_string());
        }

        // If an invite already exists for this organisation/email, not allow duplicates, we refresh the invite.
        let potential_invite = sqlx::query!(
            r#"
                SELECT id, used_at
                FROM organisation_invites
                WHERE organisation_id = $1 AND email = $2
                ORDER BY created_at DESC
                LIMIT 1
            "#,
            organisation_id,
            email
        )
        .fetch_optional(transaction.deref_mut())
        .await?;

        if let Some(existing) = potential_invite {
            let refreshed_code = nanoid!(10, &NANOID_ALPHABET);
            let refreshed_expiry = Utc::now() + Duration::days(7);

            sqlx::query!(
                r#"
                    UPDATE organisation_invites
                    SET
                        code = $1,
                        expires_at = $2,
                        created_at = NOW(),
                        used_at = NULL,
                        used_by = NULL,
                        invited_by_user_id = $3
                    WHERE id = $4
                "#,
                refreshed_code,
                refreshed_expiry,
                inviting_user_id,
                existing.id
            )
            .execute(transaction.deref_mut())
            .await?;

            return Ok(refreshed_code);
        }

        // New invite creation
        let id = snowflake_generator.real_time_generate(); // generate a new invite ID
        let code = nanoid!(10, &NANOID_ALPHABET); // generate a new invite code
        let expires_at = Utc::now() + Duration::days(7); // set the invite expiry to 7 days
        let invited_by_user_id = inviting_user_id;
        // insert the new invite into the database
        sqlx::query!(
            r#"
                INSERT INTO organisation_invites
                    (id, organisation_id, code, email, expires_at, used_at, used_by, created_at, invited_by_user_id)
                VALUES ($1, $2, $3, $4, $5, NULL, NULL, NOW(), $6)
            "#,
            id,
            organisation_id,
            code,
            email,
            expires_at,
            invited_by_user_id
        )
        .execute(transaction.deref_mut())
        .await?;

        if is_dev_env {
            println!("Invite code for {email}: {code}")
        } else {
            ChaosEmail::send_message(
                None,
                email,
                "You have been invited to join an organisation on Chaos".to_string(),
                format!("You have been invited to join an organisation on Chaos. Please use the following link to accept the invite: https://chaos.devsoc.app/dashboard/invite/{code}").to_string(),
                email_credentials
            )
            .await?;
        }

        Ok(code)
    }

    pub async fn update_logo(
        id: i64,
        transaction: &mut Transaction<'_, Postgres>,
        storage_bucket: &Bucket,
    ) -> Result<String, ChaosError> {
        let dt = Utc::now();

        let logo_id = Uuid::new_v4();
        let current_time = dt;
        _ = sqlx::query!(
            "
            UPDATE organisations
                SET logo = $2, updated_at = $3
                WHERE id = $1 RETURNING id
        ",
            id,
            logo_id,
            current_time
        )
        .fetch_one(transaction.deref_mut())
        .await?;

        let upload_url =
            Storage::generate_put_url(format!("/logo/{id}/{logo_id}"), storage_bucket).await?;

        Ok(upload_url)
    }

    pub async fn get_campaigns(
        organisation_id: i64,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<Vec<OrganisationCampaign>, ChaosError> {
        let campaigns = sqlx::query_as!(
            OrganisationCampaign,
            "
                SELECT
                    c.id, c.organisation_id, c.slug as campaign_slug, c.name, c.cover_image,
                    c.description, c.starts_at, c.ends_at, c.published, o.slug as organisation_slug,
                    c.interview_period_starts_at, c.interview_period_ends_at, c.interview_format,
                    c.outcomes_released_at, c.application_requirements
                FROM campaigns c
                LEFT JOIN organisations o on c.organisation_id = o.id
                WHERE organisation_id = $1
                ORDER BY starts_at DESC
            ",
            organisation_id
        )
        .fetch_all(transaction.deref_mut())
        .await?;

        Ok(campaigns)
    }

    pub async fn create_campaign(
        organisation_id: i64,
        mut slug: String,
        name: String,
        description: Option<String>,
        starts_at: DateTime<Utc>,
        ends_at: DateTime<Utc>,
        interview_period_starts_at: Option<DateTime<Utc>>,
        interview_period_ends_at: Option<DateTime<Utc>>,
        interview_format: Option<String>,
        outcomes_released_at: Option<DateTime<Utc>>,
        application_requirements: Option<String>,
        transaction: &mut Transaction<'_, Postgres>,
        snowflake_id_generator: &mut SnowflakeIdGenerator,
    ) -> Result<i64, ChaosError> {
        if !slug.is_ascii() {
            return Err(ChaosError::BadRequest);
        }

        slug = create_proper_slug(&slug);

        let new_campaign_id = snowflake_id_generator.real_time_generate();

        sqlx::query!(
            "
            INSERT INTO campaigns (id, organisation_id, slug, name, description, starts_at, ends_at, published, interview_period_starts_at, interview_period_ends_at, interview_format, outcomes_released_at, application_requirements)
                VALUES ($1, $2, $3, $4, $5, $6, $7, false, $8, $9, $10, $11, $12)
        ",
            new_campaign_id,
            organisation_id,
            slug.to_lowercase(),
            name,
            description,
            starts_at,
            ends_at,
            interview_period_starts_at,
            interview_period_ends_at,
            interview_format,
            outcomes_released_at,
            application_requirements,
        )
        .execute(transaction.deref_mut())
        .await?;

        Ok(new_campaign_id)
    }

    pub async fn create_email_template(
        organisation_id: i64,
        name: String,
        template_subject: String,
        template_body: String,
        transaction: &mut Transaction<'_, Postgres>,
        snowflake_generator: &mut SnowflakeIdGenerator,
    ) -> Result<i64, ChaosError> {
        let id = snowflake_generator.real_time_generate();

        let _ = sqlx::query!(
            "
                INSERT INTO email_templates (id, organisation_id, name, template_subject, template_body)
                    VALUES ($1, $2, $3, $4, $5)
            ",
            id,
            organisation_id,
            name,
            template_subject,
            template_body
        )
        .execute(transaction.deref_mut())
        .await?;

        Ok(id)
    }

    pub async fn get_user_role(
        organisation_id: i64,
        user_id: i64,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<Option<OrganisationRole>, ChaosError> {
        let possible_member = sqlx::query_as!(
            Member,
            "
                SELECT
                    organisation_members.user_id as id,
                    organisation_members.role AS \"role: OrganisationRole\",
                    users.name,
                    users.email from organisation_members
                JOIN users on users.id = organisation_members.user_id
                WHERE organisation_members.organisation_id = $1 AND organisation_members.user_id = $2
            ",
            organisation_id,
            user_id
        )
            .fetch_optional(transaction.deref_mut())
            .await?;

        if let Some(member) = possible_member {
            return Ok(Some(member.role));
        }

        Ok(None)
    }
}
