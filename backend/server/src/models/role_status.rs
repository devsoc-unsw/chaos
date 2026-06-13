//! Role status management for the Chaos application.
//!
//! This module provides database access for CRUD operations on per-campaign-role statuses.

use crate::models::application::ApplicationStatus;
use crate::models::error::ChaosError;
use serde::{Deserialize, Serialize};
use sqlx::{FromRow, Postgres, Transaction};
use std::ops::DerefMut;

/// Data structure for updating a user's per-campaign-role status.
#[derive(Deserialize, Serialize, Clone, FromRow, Debug)]
pub struct UpdateRoleStatus {
    /// The new status of the applicant for the specified campaign role.
    pub status: ApplicationStatus,
}

/// An applicant's status for a specific role.
#[derive(Deserialize, Serialize, Clone, FromRow, Debug)]
pub struct RoleStatus {
    /// The ID of the application.
    #[serde(serialize_with = "crate::models::serde_string::serialize")]
    pub application_id: i64,
    /// The ID of the campaign role.
    #[serde(serialize_with = "crate::models::serde_string::serialize")]
    pub campaign_role_id: i64,
    /// The status of the applicant for the specified campaign role.
    pub status: ApplicationStatus,
}

impl RoleStatus {
    /// Update the status of an applicant for a specific campaign role.
    ///
    /// # Arguments
    /// * `application_id` - The application to modify the status for.
    /// * `campaign_role_id` - The role to modify the status for.
    /// * `new_status` - The new status for this applicant in this particular role.
    /// * `transaction` - Database transaction to use.
    ///
    pub async fn update_status(
        application_id: i64,
        campaign_role_id: i64,
        new_status: ApplicationStatus,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<(), ChaosError> {
        sqlx::query!(
            "
                UPDATE application_roles
                SET role_status = $1
                WHERE application_id = $2 AND campaign_role_id = $3
            ",
            new_status as ApplicationStatus,
            application_id,
            campaign_role_id,
        )
        .execute(transaction.deref_mut())
        .await?;

        Ok(())
    }

    /// Fetch all the per-campaign-role statuses for a given application.
    ///
    /// # Arguments
    /// * `application_id` - The application to fetch the role statuses for.
    /// * `transaction` - Database transaction to use.
    ///
    /// # Returns
    /// A vector of all the per-campaign-role statuses for the application.
    pub async fn get_all_for_application(
        application_id: i64,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<Vec<RoleStatus>, ChaosError> {
        // Fetch all per-campaign-role statuses for the application
        let status_vec = sqlx::query_as!(
            RoleStatus,
            r#"
                SELECT application_id, campaign_role_id, role_status AS "status: ApplicationStatus"
                       FROM application_roles
                WHERE application_id = $1
                ORDER BY campaign_role_id
            "#,
            application_id
        )
        .fetch_all(transaction.deref_mut())
        .await?;

        // Return status vector
        Ok(status_vec)
    }

    /// Fetch all the per-campaign-role statuses for a given campaign role.
    ///
    /// # Arguments
    /// * `campaign_role_id` - The campaign role to fetch the role statuses for.
    /// * `transaction` - Database transaction to use.
    ///
    /// # Returns
    /// A vector of all the per-campaign-role statuses for the campaign role.
    pub async fn get_all_for_campaign_role(
        campaign_role_id: i64,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<Vec<RoleStatus>, ChaosError> {
        // Fetch all per-campaign statuses for the campaign role
        let status_vec = sqlx::query_as!(
            RoleStatus,
            r#"
                SELECT application_id, campaign_role_id, role_status AS "status: ApplicationStatus"
                       FROM application_roles
                WHERE campaign_role_id = $1
                ORDER BY campaign_role_id
            "#,
            campaign_role_id
        )
        .fetch_all(transaction.deref_mut())
        .await?;

        // Return status vector
        Ok(status_vec)
    }

    /// Fetch all the per-campaign-role statuses for a given campaign.
    ///
    /// # Arguments
    /// * `campaign_id` - The campaign to fetch the role statuses for.
    /// * `transaction` - Database transaction to use.
    ///
    /// # Returns
    /// A vector of all the per-campaign-role statuses for the campaign.
    pub async fn get_all_for_campaign(
        campaign_id: i64,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<Vec<RoleStatus>, ChaosError> {
        // Fetch all per-campaign statuses for the campaign
        let status_vec = sqlx::query_as!(
            RoleStatus,
            r#"
                SELECT application_id, campaign_role_id, role_status AS "status: ApplicationStatus"
                       FROM application_roles
                INNER JOIN campaign_roles cr ON campaign_role_id = cr.id
                WHERE cr.campaign_id = $1
                ORDER BY campaign_role_id
            "#,
            campaign_id
        )
        .fetch_all(transaction.deref_mut())
        .await?;

        // Return status vector
        Ok(status_vec)
    }
}
