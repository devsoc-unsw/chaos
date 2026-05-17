//! Role status handler for the Chaos application.
//!
//! This module provides HTTP request handlers for CRUD operations on per-campaign-role statuses.

use crate::models::app::AppMessage;
use crate::models::auth::{AuthUser, CampaignOrgMember};
use crate::models::error::ChaosError;
use crate::models::role_status::{RoleStatus, UpdateRoleStatus};
use crate::models::transaction::DBTransaction;
use axum::extract::{Json, Path};
use axum::response::IntoResponse;

/// Handler for per-campaign-role status related HTTP requests.
pub struct RoleStatusHandler;

impl RoleStatusHandler {
    /// Set the per-campaign-role status for a given application.
    ///
    /// # Arguments
    /// * `application_id` - ID of the application whose status is being set.
    /// * `campaign_role_id` - ID of the campaign role whose per-role status is being set.
    /// * `_admin` - Authenticated user allowed to set the application's per-role status.
    /// * `transaction` - Database transaction wrapper.
    /// * `data` - Update role payload.
    ///
    /// # Returns
    /// A success message.
    pub async fn update_role_status(
        Path(application_id): Path<i64>,
        Path(campaign_role_id): Path<i64>,
        // TODO: Replace the AuthUser extractor with something that enforces the desired permissions.
        _admin: AuthUser,
        mut transaction: DBTransaction<'_>,
        Json(data): Json<UpdateRoleStatus>,
    ) -> Result<impl IntoResponse, ChaosError> {
        RoleStatus::update_status(
            application_id,
            campaign_role_id,
            data.status,
            &mut transaction.tx,
        )
        .await?;

        transaction.tx.commit().await?;

        Ok(AppMessage::OkMessage(
            "Successfully set per-campaign-role status.",
        ))
    }

    /// Get all per-campaign-role statuses for an application.
    ///
    /// # Arguments
    /// * `application_id` - ID of the application to fetch the per-campaign-role statuses for.
    /// * `_admin` - Authenticated user allowed to view the application's per-role statuses.
    /// * `transaction` - Database transaction wrapper.
    ///
    /// # Returns
    /// The per-campaign-role statuses for the application.
    pub async fn get_role_statuses_for_application(
        Path(application_id): Path<i64>,
        // TODO: Replace the AuthUser extractor with something that enforces the desired permissions.
        _admin: AuthUser,
        mut transaction: DBTransaction<'_>,
    ) -> Result<impl IntoResponse, ChaosError> {
        let statuses =
            RoleStatus::get_all_for_application(application_id, &mut transaction.tx).await?;

        transaction.tx.commit().await?;

        Ok(Json(statuses))
    }

    /// Get all per-campaign-role statuses for a campaign role.
    ///
    /// # Arguments
    /// * `campaign_id` - ID of the campaign to fetch the per-campaign-role statuses for.
    /// * `campaign_role_id` - ID of the campaign role to fetch the per-role statuses for.
    /// * `_admin` - Authenticated user allowed to view the campaign role's statuses.
    /// * `transaction` - Database transaction wrapper.
    ///
    /// # Returns
    /// The per-role statuses for the campaign role.
    pub async fn get_role_statuses_for_campaign_role(
        Path(campaign_id): Path<i64>,
        Path(campaign_role_id): Path<i64>,
        // TODO: Replace the CampaignOrgMember extractor with something that enforces the desired permissions.
        _admin: CampaignOrgMember,
        mut transaction: DBTransaction<'_>,
    ) -> Result<impl IntoResponse, ChaosError> {
        let statuses =
            RoleStatus::get_all_for_campaign_role(campaign_role_id, &mut transaction.tx).await?;

        transaction.tx.commit().await?;

        Ok(Json(statuses))
    }

    /// Get all per-campaign-role statuses for a campaign.
    ///
    /// # Arguments
    /// * `campaign_id` - ID of the campaign to fetch the per-campaign-role statuses for.
    /// * `_admin` - Authenticated user allowed to view the campaign's per-role statuses.
    /// * `transaction` - Database transaction wrapper.
    ///
    /// # Returns
    /// The per-role statuses for the campaign.
    pub async fn get_role_statuses_for_campaign(
        Path(campaign_id): Path<i64>,
        // TODO: Replace the CampaignOrgMember extractor with something that enforces the desired permissions.
        _admin: CampaignOrgMember,
        mut transaction: DBTransaction<'_>,
    ) -> Result<impl IntoResponse, ChaosError> {
        let statuses = RoleStatus::get_all_for_campaign(campaign_id, &mut transaction.tx).await?;

        transaction.tx.commit().await?;

        Ok(Json(statuses))
    }
}
