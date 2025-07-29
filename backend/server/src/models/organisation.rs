//! Organisation management for Chaos.
//! 
//! This module provides functionality for managing organisations in the system,
//! including creation, updates, member management, and campaign creation.

use crate::models::campaign::OrganisationCampaign;
use crate::models::error::ChaosError;
use crate::models::storage::Storage;
use chrono::{DateTime, Utc};
use s3::Bucket;
use serde::{Deserialize, Serialize};
use snowflake::SnowflakeIdGenerator;
use sqlx::{FromRow, Pool, Postgres, Transaction};
use std::ops::DerefMut;
use uuid::Uuid;

/// Represents an organisation in the database.
/// 
/// An organisation is a group that can run recruitment campaigns
/// and manage its members and administrators.
#[derive(Deserialize, Serialize, Clone, FromRow, Debug)]
pub struct Organisation {
    /// Unique identifier for the organisation
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
    /// List of campaigns run by this organisation
    pub campaigns: Vec<OrganisationCampaign>, // Awaiting Campaign to be complete - remove comment once done
    /// List of user IDs who are administrators of this organisation
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
}

/// Detailed view of an organisation's information.
/// 
/// This struct provides a complete view of an organisation's details,
/// used primarily for API responses.
#[derive(Deserialize, Serialize)]
pub struct OrganisationDetails {
    /// Unique identifier for the organisation
    pub id: i64,
    /// URL-friendly identifier for the organisation
    pub slug: String,
    /// Display name of the organisation
    pub name: String,
    /// Optional UUID of the organisation's logo
    pub logo: Option<Uuid>,
    /// When the organisation was created
    pub created_at: DateTime<Utc>,
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
    pub id: i64,
    /// Name of the user
    pub name: String,
    /// User's role in the organisation
    pub role: OrganisationRole,
}

/// Collection of organisation members.
/// 
/// This struct represents all members of an organisation,
/// used for API responses.
#[derive(Deserialize, Serialize)]
pub struct MemberList {
    /// List of members in the organisation
    pub members: Vec<Member>,
}

/// Data structure for updating organisation administrators.
/// 
/// This struct contains a list of user IDs who should be
/// administrators of the organisation.
#[derive(Deserialize, Serialize)]
pub struct AdminUpdateList {
    /// List of user IDs to be administrators
    pub members: Vec<i64>,
}

/// Data structure for removing an administrator.
/// 
/// This struct contains the ID of the user to remove
/// from the administrator role.
#[derive(Deserialize, Serialize)]
pub struct AdminToRemove {
    /// ID of the user to remove as administrator
    pub user_id: i64,
}

/// Data structure for checking slug availability.
/// 
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
        slug: String,
        name: String,
        snowflake_generator: &mut SnowflakeIdGenerator,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<i64, ChaosError> {
        if !slug.is_ascii() {
            return Err(ChaosError::BadRequest);
        }

        let id = snowflake_generator.real_time_generate();

        sqlx::query!(
            "
            INSERT INTO organisations (id, slug, name)
                VALUES ($1, $2, $3)
        ",
            id,
            slug.to_lowercase(),
            name
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
        slug: String,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<(), ChaosError> {
        if !slug.is_ascii() {
            return Err(ChaosError::BadRequest);
        }

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
    pub async fn get(id: i64, transaction: &mut Transaction<'_, Postgres>,) -> Result<OrganisationDetails, ChaosError> {
        let organisation = sqlx::query_as!(
            OrganisationDetails,
            "
            SELECT id, slug, name, logo, created_at
                FROM organisations
                WHERE id = $1
        ",
            id
        )
        .fetch_one(transaction.deref_mut())
        .await?;

        Ok(organisation)
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
            SELECT id, slug, name, logo, created_at
                FROM organisations
                WHERE slug = $1
        ",
            slug
        )
        .fetch_one(transaction.deref_mut())
        .await?;

        Ok(organisation)
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
    pub async fn delete(id: i64, transaction: &mut Transaction<'_, Postgres>,) -> Result<(), ChaosError> {
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
    ) -> Result<MemberList, ChaosError> {
        let admin_list = sqlx::query_as!(
        Member,
        "
            SELECT organisation_members.user_id as id, organisation_members.role AS \"role: OrganisationRole\", users.name from organisation_members
                JOIN users on users.id = organisation_members.user_id
                WHERE organisation_members.organisation_id = $1 AND organisation_members.role = $2
        ",
        organisation_id,
            OrganisationRole::Admin as OrganisationRole
    )
            .fetch_all(transaction.deref_mut())
            .await?;

        Ok(MemberList {
            members: admin_list,
        })
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
    ) -> Result<MemberList, ChaosError> {
        let admin_list = sqlx::query_as!(
        Member,
        "
            SELECT organisation_members.user_id as id, organisation_members.role AS \"role: OrganisationRole\", users.name from organisation_members
                JOIN users on users.id = organisation_members.user_id
                WHERE organisation_members.organisation_id = $1
        ",
        organisation_id
    )
            .fetch_all(transaction.deref_mut())
            .await?;

        Ok(MemberList {
            members: admin_list,
        })
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
            admin_to_remove,
            organisation_id,
            OrganisationRole::User as OrganisationRole
        )
        .execute(transaction.deref_mut())
        .await?;

        Ok(())
    }

    pub async fn remove_member(
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
            DELETE FROM organisation_members WHERE user_id = $1 AND organisation_id = $2
        ",
            user_id,
            organisation_id
        )
        .execute(transaction.deref_mut())
        .await?;

        Ok(())
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
                SELECT id, slug, name, cover_image, description, starts_at, ends_at
                FROM campaigns
                WHERE organisation_id = $1
            ",
            organisation_id
        )
        .fetch_all(transaction.deref_mut())
        .await?;

        Ok(campaigns)
    }

    pub async fn create_campaign(
        organisation_id: i64,
        slug: String,
        name: String,
        description: Option<String>,
        starts_at: DateTime<Utc>,
        ends_at: DateTime<Utc>,
        transaction: &mut Transaction<'_, Postgres>,
        snowflake_id_generator: &mut SnowflakeIdGenerator,
    ) -> Result<i64, ChaosError> {
        if !slug.is_ascii() {
            return Err(ChaosError::BadRequest);
        }

        let new_campaign_id = snowflake_id_generator.real_time_generate();

        sqlx::query!(
            "
            INSERT INTO campaigns (id, organisation_id, slug, name, description, starts_at, ends_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
        ",
            new_campaign_id,
            organisation_id,
            slug.to_lowercase(),
            name,
            description,
            starts_at,
            ends_at
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
}
