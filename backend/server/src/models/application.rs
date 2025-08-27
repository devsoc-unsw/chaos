//! Application management module for the Chaos application.
//! 
//! This module provides functionality for managing applications within recruitment campaigns,
//! including creating, retrieving, updating, and submitting applications. It also handles
//! application status management and role preferences.

use std::collections::HashMap;
use crate::models::error::ChaosError;
use crate::models::user::UserDetails;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use snowflake::SnowflakeIdGenerator;
use sqlx::{FromRow, Pool, Postgres, Transaction};
use std::ops::DerefMut;
use axum::{async_trait, RequestPartsExt};
use axum::extract::{FromRef, FromRequestParts, Path};
use axum::http::request::Parts;
use crate::models::app::AppState;
use crate::service::answer::assert_answer_application_is_open;
use crate::service::application::{assert_application_is_open};

/// Represents an application in the system.
/// 
/// An application is a user's submission for one or more roles within a campaign.
/// It tracks the application's status, both public and private, and maintains
/// timestamps for creation and updates.
#[derive(Deserialize, Serialize, Clone, FromRow, Debug)]
pub struct Application {
    /// Unique identifier for the application
    #[serde(serialize_with = "crate::models::serde_string::serialize")]
    pub id: i64,
    /// ID of the campaign this application belongs to
    #[serde(serialize_with = "crate::models::serde_string::serialize")]
    pub campaign_id: i64,
    /// ID of the user who submitted the application
    #[serde(serialize_with = "crate::models::serde_string::serialize")]
    pub user_id: i64,
    /// Public status of the application
    pub status: ApplicationStatus,
    /// Private status of the application (visible only to admins)
    pub private_status: ApplicationStatus,
    /// Timestamp when the application was created
    pub created_at: DateTime<Utc>,
    /// Timestamp when the application was last updated
    pub updated_at: DateTime<Utc>,
}

/// Represents a role preference within an application.
/// 
/// Users can apply for multiple roles in a single application, specifying their
/// preferences for each role. This struct links an application to a specific role
/// and includes the user's preference ranking.
#[derive(Deserialize, Serialize, Clone, FromRow, Debug)]
pub struct ApplicationRole {
    /// Unique identifier for the role application
    #[serde(serialize_with = "crate::models::serde_string::serialize")]
    #[serde(deserialize_with = "crate::models::serde_string::deserialize")]
    pub id: i64,
    /// ID of the parent application
    #[serde(serialize_with = "crate::models::serde_string::serialize")]
    #[serde(deserialize_with = "crate::models::serde_string::deserialize")]
    pub application_id: i64,
    /// ID of the campaign role being applied for
    #[serde(serialize_with = "crate::models::serde_string::serialize")]
    #[serde(deserialize_with = "crate::models::serde_string::deserialize")]
    pub campaign_role_id: i64,
    /// User's preference ranking for this role (lower number = higher preference)
    pub preference: i32,
}

/// Data structure for creating a new application.
/// 
/// Contains the list of roles the user is applying for, with their preferences.
#[derive(Deserialize, Serialize)]
pub struct NewApplication {
    /// List of roles the user is applying for
    pub applied_roles: Vec<ApplicationRole>,
}

/// Detailed view of an application, including user information and role preferences.
/// 
/// This structure combines application data with user details and the specific roles
/// the user has applied for.
#[derive(Deserialize, Serialize)]
pub struct ApplicationDetails {
    /// Unique identifier for the application
    #[serde(serialize_with = "crate::models::serde_string::serialize")]
    pub id: i64,
    /// ID of the campaign this application belongs to
    #[serde(serialize_with = "crate::models::serde_string::serialize")]
    pub campaign_id: i64,
    /// Details of the user who submitted the application
    pub user: UserDetails,
    /// Public status of the application
    pub status: ApplicationStatus,
    /// Private status of the application (visible only to admins)
    pub private_status: ApplicationStatus,
    /// List of roles the user has applied for, with details
    pub applied_roles: Vec<ApplicationAppliedRoleDetails>,
}

/// Raw application data from the database.
/// 
/// Contains all fields needed to construct an ApplicationDetails structure,
/// including user information and application status.
#[derive(Deserialize, Serialize)]
pub struct ApplicationData {
    /// Unique identifier for the application
    #[serde(serialize_with = "crate::models::serde_string::serialize")]
    pub id: i64,
    /// ID of the campaign this application belongs to
    #[serde(serialize_with = "crate::models::serde_string::serialize")]
    pub campaign_id: i64,
    /// ID of the user who submitted the application
    #[serde(serialize_with = "crate::models::serde_string::serialize")]
    pub user_id: i64,
    /// Email address of the applicant
    pub user_email: String,
    /// Student ID of the applicant
    pub user_zid: Option<String>,
    /// Full name of the applicant
    pub user_name: String,
    /// Pronouns of the applicant
    pub user_pronouns: Option<String>,
    /// Gender of the applicant
    pub user_gender: Option<String>,
    /// Degree program of the applicant
    pub user_degree_name: Option<String>,
    /// Starting year of the applicant's degree
    pub user_degree_starting_year: Option<i32>,
    /// Public status of the application
    pub status: ApplicationStatus,
    /// Private status of the application (visible only to admins)
    pub private_status: ApplicationStatus,
}

/// Details about a role that has been applied for.
/// 
/// Contains information about the role and the user's preference for it.
#[derive(Deserialize, Serialize)]
pub struct ApplicationAppliedRoleDetails {
    /// ID of the campaign role
    #[serde(serialize_with = "crate::models::serde_string::serialize")]
    pub campaign_role_id: i64,
    /// Name of the role
    pub role_name: String,
    /// User's preference ranking for this role
    pub preference: i32,
}

/// Data structure for updating role preferences in an application.
#[derive(Deserialize)]
pub struct ApplicationRoleUpdate {
    /// Updated list of role preferences
    pub roles: Vec<ApplicationRole>,
}

/// Possible statuses for an application.
/// 
/// Applications can be in one of three states: pending review, rejected, or successful.
#[derive(Deserialize, Serialize, sqlx::Type, Clone, Debug)]
#[sqlx(type_name = "application_status", rename_all = "PascalCase")]
pub enum ApplicationStatus {
    /// Application is pending review
    Pending,
    /// Application has been rejected
    Rejected,
    /// Application has been successful
    Successful,
}

impl Application {
    /// Creates a new application if it doesn't exist, otherwise returns the existing application ID.
    /// 
    /// # Arguments
    /// 
    /// * `campaign_id` - ID of the campaign to apply to
    /// * `user_id` - ID of the user submitting the application
    /// * `snowflake_generator` - Generator for creating unique IDs
    /// * `transaction` - Database transaction to use
    /// 
    /// # Returns
    /// 
    /// * `Result<i64, ChaosError>` - ID of the application or error
    pub async fn create_or_get(
        campaign_id: i64,
        user_id: i64,
        snowflake_generator: &mut SnowflakeIdGenerator,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<i64, ChaosError> {
        // Check if application already exists
        let application = sqlx::query!(
            "
                SELECT id FROM applications
                WHERE campaign_id = $1 AND user_id = $2
            ",
            campaign_id,
            user_id
        )
        .fetch_optional(transaction.deref_mut())
        .await?;

        if let Some(application) = application {
            return Ok(application.id);
        }

        let id = snowflake_generator.real_time_generate();
        // Create new application
        sqlx::query!(
            "
                INSERT INTO applications (id, campaign_id, user_id)
                VALUES ($1, $2, $3)
            ",
            id,
            campaign_id,
            user_id
        )
        .execute(transaction.deref_mut())
        .await?;

        Ok(id)
    }
    
    /// Creates a new application in the system.
    /// 
    /// # Arguments
    /// 
    /// * `campaign_id` - ID of the campaign to apply to
    /// * `user_id` - ID of the user submitting the application
    /// * `application_data` - Details of the application including role preferences
    /// * `snowflake_generator` - Generator for creating unique IDs
    /// * `transaction` - Database transaction to use
    /// 
    /// # Returns
    /// 
    /// * `Result<(), ChaosError>` - Success or error
    pub async fn create(
        campaign_id: i64,
        user_id: i64,
        application_data: NewApplication,
        snowflake_generator: &mut SnowflakeIdGenerator,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<i64, ChaosError> {
        let id = snowflake_generator.real_time_generate();

        // Insert into table applications
        sqlx::query!(
            "
                INSERT INTO applications (id, campaign_id, user_id)
                VALUES ($1, $2, $3)
            ",
            id,
            campaign_id,
            user_id
        )
        .execute(transaction.deref_mut())
        .await?;

        // Insert into table application_roles
        for role_applied in application_data.applied_roles {
            sqlx::query!(
                "
                    INSERT INTO application_roles (application_id, campaign_role_id, preference)
                    VALUES ($1, $2, $3)
                ",
                id,
                role_applied.campaign_role_id,
                role_applied.preference
            )
            .execute(transaction.deref_mut())
            .await?;
        }

        Ok(id)
    }

    /// Retrieves an application by its ID.
    /// 
    /// # Arguments
    /// 
    /// * `id` - ID of the application to retrieve
    /// * `transaction` - Database transaction to use
    /// 
    /// # Returns
    /// 
    /// * `Result<ApplicationDetails, ChaosError>` - Application details or error
    pub async fn get(
        id: i64,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<ApplicationDetails, ChaosError> {
        let application_data = sqlx::query_as!(
            ApplicationData,
            "
                SELECT a.id AS id, campaign_id, user_id, status AS \"status: ApplicationStatus\",
                private_status AS \"private_status: ApplicationStatus\", u.email AS user_email,
                u.zid AS user_zid, u.name AS user_name, u.gender AS user_gender,
                u.pronouns AS user_pronouns, u.degree_name AS user_degree_name,
                u.degree_starting_year AS user_degree_starting_year
                FROM applications a
                JOIN users u ON u.id = a.user_id
                JOIN campaigns c ON c.id = a.campaign_id
                WHERE a.id = $1 AND a.submitted = true
            ",
            id
        )
        .fetch_one(transaction.deref_mut())
        .await?;

        let applied_roles = sqlx::query_as!(
            ApplicationAppliedRoleDetails,
            "
                SELECT application_roles.campaign_role_id,
                application_roles.preference, campaign_roles.name AS role_name
                FROM application_roles
                    JOIN campaign_roles
                    ON application_roles.campaign_role_id = campaign_roles.id
                WHERE application_id = $1
            ",
            id
        )
        .fetch_all(transaction.deref_mut())
        .await?;

        Ok(ApplicationDetails {
            id: application_data.id,
            campaign_id: application_data.campaign_id,
            status: application_data.status,
            private_status: application_data.private_status,
            applied_roles,
            user: UserDetails {
                id: application_data.user_id,
                email: application_data.user_email,
                zid: application_data.user_zid,
                name: application_data.user_name,
                pronouns: application_data.user_pronouns,
                gender: application_data.user_gender,
                degree_name: application_data.user_degree_name,
                degree_starting_year: application_data.user_degree_starting_year,
            },
        })
    }

    /// Retrieves all applications for a specific role.
    /// 
    /// # Arguments
    /// 
    /// * `role_id` - ID of the role to get applications for
    /// * `transaction` - Database transaction to use
    /// 
    /// # Returns
    /// 
    /// * `Result<Vec<ApplicationDetails>, ChaosError>` - List of applications or error
    pub async fn get_from_role_id(
        role_id: i64,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<Vec<ApplicationDetails>, ChaosError> {
        let application_data_list = sqlx::query_as!(
            ApplicationData,
            "
                SELECT a.id AS id, campaign_id, user_id, status AS \"status: ApplicationStatus\",
                private_status AS \"private_status: ApplicationStatus\", u.email AS user_email,
                u.zid AS user_zid, u.name AS user_name, u.gender AS user_gender,
                u.pronouns AS user_pronouns, u.degree_name AS user_degree_name,
                u.degree_starting_year AS user_degree_starting_year
                FROM applications a
                JOIN users u ON u.id = a.user_id
                JOIN application_roles ar on ar.application_id = a.id
                JOIN campaigns c on c.id = a.campaign_id
                WHERE ar.id = $1 AND a.submitted = true
            ",
            role_id
        )
            .fetch_all(transaction.deref_mut())
            .await?;

        let mut application_details_list = Vec::new();
        for application_data in application_data_list {
            let applied_roles = sqlx::query_as!(
                ApplicationAppliedRoleDetails,
                "
                    SELECT application_roles.campaign_role_id,
                    application_roles.preference, campaign_roles.name AS role_name
                    FROM application_roles
                        JOIN campaign_roles
                        ON application_roles.campaign_role_id = campaign_roles.id
                    WHERE application_id = $1
                ",
                application_data.id
            )
            .fetch_all(transaction.deref_mut())
            .await?;

            let details = ApplicationDetails {
                id: application_data.id,
                campaign_id: application_data.campaign_id,
                status: application_data.status,
                private_status: application_data.private_status,
                applied_roles,
                user: UserDetails {
                    id: application_data.user_id,
                    email: application_data.user_email,
                    zid: application_data.user_zid,
                    name: application_data.user_name,
                    pronouns: application_data.user_pronouns,
                    gender: application_data.user_gender,
                    degree_name: application_data.user_degree_name,
                    degree_starting_year: application_data.user_degree_starting_year,
                },
            };

            application_details_list.push(details);
        }

        Ok(application_details_list)
    }

    /// Retrieves all applications for a specific campaign.
    /// 
    /// # Arguments
    /// 
    /// * `campaign_id` - ID of the campaign to get applications for
    /// * `transaction` - Database transaction to use
    /// 
    /// # Returns
    /// 
    /// * `Result<Vec<ApplicationDetails>, ChaosError>` - List of applications or error
    pub async fn get_from_campaign_id(
        campaign_id: i64,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<Vec<ApplicationDetails>, ChaosError> {
        let application_data_list = sqlx::query_as!(
            ApplicationData,
            "
                SELECT a.id AS id, campaign_id, user_id, status AS \"status: ApplicationStatus\",
                private_status AS \"private_status: ApplicationStatus\", u.email AS user_email,
                u.zid AS user_zid, u.name AS user_name, u.gender AS user_gender,
                u.pronouns AS user_pronouns, u.degree_name AS user_degree_name,
                u.degree_starting_year AS user_degree_starting_year
                FROM applications a
                JOIN users u ON u.id = a.user_id
                JOIN campaigns c ON c.id = a.campaign_id
                WHERE a.campaign_id = $1 AND a.submitted = true
            ",
            campaign_id
        )
        .fetch_all(transaction.deref_mut())
        .await?;

        let mut application_details_list = Vec::new();
        for application_data in application_data_list {
            let applied_roles = sqlx::query_as!(
                ApplicationAppliedRoleDetails,
                "
                    SELECT application_roles.campaign_role_id,
                    application_roles.preference, campaign_roles.name AS role_name
                    FROM application_roles
                        JOIN campaign_roles
                        ON application_roles.campaign_role_id = campaign_roles.id
                    WHERE application_id = $1
                ",
                application_data.id
            )
            .fetch_all(transaction.deref_mut())
            .await?;

            let details = ApplicationDetails {
                id: application_data.id,
                campaign_id: application_data.campaign_id,
                status: application_data.status,
                private_status: application_data.private_status,
                applied_roles,
                user: UserDetails {
                    id: application_data.user_id,
                    email: application_data.user_email,
                    zid: application_data.user_zid,
                    name: application_data.user_name,
                    pronouns: application_data.user_pronouns,
                    gender: application_data.user_gender,
                    degree_name: application_data.user_degree_name,
                    degree_starting_year: application_data.user_degree_starting_year,
                },
            };

            application_details_list.push(details)
        }

        Ok(application_details_list)
    }

    /// Retrieves all applications submitted by a specific user.
    /// 
    /// # Arguments
    /// 
    /// * `user_id` - ID of the user to get applications for
    /// * `transaction` - Database transaction to use
    /// 
    /// # Returns
    /// 
    /// * `Result<Vec<ApplicationDetails>, ChaosError>` - List of applications or error
    pub async fn get_from_user_id(
        user_id: i64,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<Vec<ApplicationDetails>, ChaosError> {
        let application_data_list = sqlx::query_as!(
            ApplicationData,
            "
                SELECT a.id AS id, campaign_id, user_id, status AS \"status: ApplicationStatus\",
                private_status AS \"private_status: ApplicationStatus\", u.email AS user_email,
                u.zid AS user_zid, u.name AS user_name, u.gender AS user_gender,
                u.pronouns AS user_pronouns, u.degree_name AS user_degree_name,
                u.degree_starting_year AS user_degree_starting_year
                FROM applications a JOIN users u ON u.id = a.user_id
                WHERE a.user_id = $1
            ",
            user_id
        )
        .fetch_all(transaction.deref_mut())
        .await?;

        let mut application_details_list = Vec::new();
        for application_data in application_data_list {
            let applied_roles = sqlx::query_as!(
                ApplicationAppliedRoleDetails,
                "
                    SELECT application_roles.campaign_role_id,
                    application_roles.preference, campaign_roles.name AS role_name
                    FROM application_roles
                        JOIN campaign_roles
                        ON application_roles.campaign_role_id = campaign_roles.id
                    WHERE application_id = $1
                ",
                application_data.id
            )
            .fetch_all(transaction.deref_mut())
            .await?;

            let details = ApplicationDetails {
                id: application_data.id,
                campaign_id: application_data.campaign_id,
                status: application_data.status.clone(),
                // To reuse struct, do not show use private status
                private_status: application_data.status,
                applied_roles,
                user: UserDetails {
                    id: application_data.user_id,
                    email: application_data.user_email,
                    zid: application_data.user_zid,
                    name: application_data.user_name,
                    pronouns: application_data.user_pronouns,
                    gender: application_data.user_gender,
                    degree_name: application_data.user_degree_name,
                    degree_starting_year: application_data.user_degree_starting_year,
                },
            };

            application_details_list.push(details)
        }

        Ok(application_details_list)
    }

    /// Updates the public status of an application.
    /// 
    /// # Arguments
    /// 
    /// * `id` - ID of the application to update
    /// * `new_status` - New status to set
    /// * `pool` - Database connection pool
    /// 
    /// # Returns
    /// 
    /// * `Result<(), ChaosError>` - Success or error
    pub async fn set_status(
        id: i64,
        new_status: ApplicationStatus,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<(), ChaosError> {
        _ = sqlx::query!(
            "
                UPDATE applications
                SET status = $2
                WHERE id = $1 RETURNING id
            ",
            id,
            new_status as ApplicationStatus
        )
        .fetch_one(transaction.deref_mut())
        .await?;

        Ok(())
    }

    /// Updates the private status of an application.
    /// 
    /// # Arguments
    /// 
    /// * `id` - ID of the application to update
    /// * `new_status` - New status to set
    /// * `pool` - Database connection pool
    /// 
    /// # Returns
    /// 
    /// * `Result<(), ChaosError>` - Success or error
    pub async fn set_private_status(
        id: i64,
        new_status: ApplicationStatus,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<(), ChaosError> {
        _ = sqlx::query!(
            "
                UPDATE applications
                SET private_status = $2
                WHERE id = $1 RETURNING id
            ",
            id,
            new_status as ApplicationStatus
        )
        .fetch_one(transaction.deref_mut())
        .await?;

        Ok(())
    }

    /// Retrieves all roles associated with a specific application.
    ///
    /// This function queries the database to get all application roles for a given
    /// application ID, including their preference rankings. The roles are returned
    /// in the order they appear in the database (typically by preference).
    ///
    /// # Arguments
    ///
    /// * `id` - The ID of the application to retrieve roles for
    /// * `transaction` - Database transaction to use
    ///
    /// # Returns
    ///
    /// * `Result<Vec<ApplicationRole>, ChaosError>` - List of application roles or error
    pub async fn get_roles(
        id: i64,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<Vec<ApplicationRole>, ChaosError> {
        let roles = sqlx::query_as!(
            ApplicationRole,

            "
                SELECT id, application_id, campaign_role_id, preference
                FROM application_roles
                WHERE application_id = $1
            ",
            id
        )
        .fetch_all(transaction.deref_mut())
        .await?;

        Ok(roles)
    }

    /// Updates the role preferences for an application.
    /// 
    /// # Arguments
    /// 
    /// * `id` - ID of the application to update
    /// * `roles` - New list of role preferences
    /// * `transaction` - Database transaction to use
    /// 
    /// # Returns
    /// 
    /// * `Result<(), ChaosError>` - Success or error
    pub async fn update_roles(
        id: i64,
        roles: Vec<ApplicationRole>,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<(), ChaosError> {
        sqlx::query!(
            "
                DELETE FROM application_roles WHERE application_id = $1
            ",
            id
        )
        .execute(transaction.deref_mut())
        .await?;

        // Insert into table application_roles
        for role in roles {
            sqlx::query!(
                "
                    INSERT INTO application_roles (application_id, campaign_role_id, preference)
                    VALUES ($1, $2, $3)
                ",
                id,
                role.campaign_role_id,
                role.preference
            )
            .execute(transaction.deref_mut())
            .await?;
        }

        Ok(())
    }

    /// Submits an application, marking it as ready for review.
    /// 
    /// # Arguments
    /// 
    /// * `id` - ID of the application to submit
    /// * `transaction` - Database transaction to use
    /// 
    /// # Returns
    /// 
    /// * `Result<(), ChaosError>` - Success or error
    pub async fn submit(
        id: i64,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<(), ChaosError> {
        let _ = sqlx::query!(
            "
                UPDATE applications SET submitted = true WHERE id = $1 RETURNING id
            ",
            id
        )
        .fetch_one(transaction.deref_mut())
        .await?;

        Ok(())
    }
}

/// Extractor for ensuring an application is open by application ID.
/// 
/// This extractor is used in route handlers to ensure that the application
/// being accessed is still open for submissions.
pub struct OpenApplicationByApplicationId;

#[async_trait]
impl<S> FromRequestParts<S> for OpenApplicationByApplicationId
where
    S: Send + Sync,
    AppState: FromRef<S>,
{
    type Rejection = ChaosError;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let app_state = AppState::from_ref(state);

        let application_id = *parts
            .extract::<Path<HashMap<String, i64>>>()
            .await
            .map_err(|_| ChaosError::BadRequest)?
            .get("application_id")
            .ok_or(ChaosError::BadRequest)?;

        let mut tx = app_state.db.begin().await?;
        assert_application_is_open(application_id, &mut tx).await?;
        tx.commit().await?;

        Ok(OpenApplicationByApplicationId)
    }
}

/// Extractor for ensuring an application is open by answer ID.
/// 
/// This extractor is used in route handlers to ensure that the application
/// associated with an answer is still open for submissions.
pub struct OpenApplicationByAnswerId;

#[async_trait]
impl<S> FromRequestParts<S> for OpenApplicationByAnswerId
where
    S: Send + Sync,
    AppState: FromRef<S>,
{
    type Rejection = ChaosError;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let app_state = AppState::from_ref(state);

        let answer_id = *parts
            .extract::<Path<HashMap<String, i64>>>()
            .await
            .map_err(|_| ChaosError::BadRequest)?
            .get("answer_id")
            .ok_or(ChaosError::BadRequest)?;

        let mut tx = app_state.db.begin().await?;
        assert_answer_application_is_open(answer_id, &mut tx).await?;
        tx.commit().await?;

        Ok(OpenApplicationByAnswerId)
    }
}