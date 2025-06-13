//! Offer management for Chaos.
//! 
//! This module provides functionality for managing job offers in recruitment campaigns,
//! including creation, updates, and email notifications.

use crate::models::email::{ChaosEmail, EmailCredentials, EmailParts};
use crate::models::email_template::EmailTemplate;
use crate::models::error::ChaosError;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use snowflake::SnowflakeIdGenerator;
use sqlx::{Postgres, Transaction};
use std::ops::DerefMut;

/// Represents an offer in the database.
/// 
/// An offer represents a job offer made to an applicant, including
/// the associated role, campaign, and email template for notification.
#[derive(Deserialize)]
pub struct Offer {
    /// Unique identifier for the offer
    pub id: i64,
    /// ID of the campaign this offer belongs to
    pub campaign_id: i64,
    /// ID of the application this offer is for
    pub application_id: i64,
    /// ID of the email template to use for notifications
    pub email_template_id: i64,
    /// ID of the role being offered
    pub role_id: i64,
    /// When the offer expires
    pub expiry: DateTime<Utc>,
    /// Current status of the offer
    pub status: OfferStatus,
    /// When the offer was created
    pub created_at: DateTime<Utc>,
}

/// Detailed view of an offer's information.
/// 
/// This struct provides a complete view of an offer's details,
/// including related information from other tables.
#[derive(Deserialize, Serialize)]
pub struct OfferDetails {
    /// Unique identifier for the offer
    pub id: i64,
    /// ID of the campaign this offer belongs to
    pub campaign_id: i64,
    /// Name of the organisation making the offer
    pub organisation_name: String,
    /// Name of the campaign
    pub campaign_name: String,
    /// ID of the application this offer is for
    pub application_id: i64,
    /// ID of the user receiving the offer
    pub user_id: i64,
    /// Name of the user receiving the offer
    pub user_name: String,
    /// Email address of the user receiving the offer
    pub user_email: String,
    /// ID of the email template to use for notifications
    pub email_template_id: i64,
    /// ID of the role being offered
    pub role_id: i64,
    /// Name of the role being offered
    pub role_name: String,
    /// When the offer expires
    pub expiry: DateTime<Utc>,
    /// Current status of the offer
    pub status: OfferStatus,
    /// When the offer was created
    pub created_at: DateTime<Utc>,
}

/// Possible states of an offer.
/// 
/// This enum represents the different states an offer can be in,
/// from initial creation to final acceptance or rejection.
#[derive(Deserialize, Serialize, sqlx::Type, Clone, Debug)]
#[sqlx(type_name = "offer_status", rename_all = "PascalCase")]
pub enum OfferStatus {
    /// Offer is in draft state and hasn't been sent
    Draft,
    /// Offer has been sent to the applicant
    Sent,
    /// Offer has been accepted by the applicant
    Accepted,
    /// Offer has been declined by the applicant
    Declined,
}

/// Response to an offer.
/// 
/// This struct represents an applicant's response to an offer,
/// indicating whether they accept or decline.
#[derive(Deserialize)]
pub struct OfferReply {
    /// Whether the offer is accepted
    pub accept: bool,
}

impl Offer {
    /// Creates a new offer.
    /// 
    /// # Arguments
    /// * `campaign_id` - The ID of the campaign
    /// * `application_id` - The ID of the application
    /// * `email_template_id` - The ID of the email template to use
    /// * `role_id` - The ID of the role being offered
    /// * `expiry` - When the offer expires
    /// * `transaction` - A mutable reference to the database transaction
    /// * `snowflake_id_generator` - A generator for creating unique IDs
    /// 
    /// # Returns
    /// Returns a `Result` containing either:
    /// * `Ok(i64)` - The ID of the created offer
    /// * `Err(ChaosError)` - An error if creation fails
    pub async fn create(
        campaign_id: i64,
        application_id: i64,
        email_template_id: i64,
        role_id: i64,
        expiry: DateTime<Utc>,
        transaction: &mut Transaction<'_, Postgres>,
        mut snowflake_id_generator: SnowflakeIdGenerator,
    ) -> Result<i64, ChaosError> {
        let id = snowflake_id_generator.real_time_generate();

        let _ = sqlx::query!(
            "
                INSERT INTO offers (id, campaign_id, application_id, email_template_id, role_id, expiry) VALUES ($1, $2, $3, $4, $5, $6)
            ",
            id,
            campaign_id,
            application_id,
            email_template_id,
            role_id,
            expiry
        )
            .execute(transaction.deref_mut())
            .await?;

        Ok(id)
    }

    /// Retrieves an offer by its ID.
    /// 
    /// # Arguments
    /// * `id` - The ID of the offer to retrieve
    /// * `transaction` - A mutable reference to the database transaction
    /// 
    /// # Returns
    /// Returns a `Result` containing either:
    /// * `Ok(OfferDetails)` - The requested offer details
    /// * `Err(ChaosError)` - An error if retrieval fails
    pub async fn get(
        id: i64,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<OfferDetails, ChaosError> {
        let offer = sqlx::query_as!(
            OfferDetails,
            r#"
                SELECT
                    off.id, off.campaign_id, off.application_id, off.email_template_id,
                    off.role_id, off.expiry, off.created_at,
                    off.status AS "status!: OfferStatus",
                    c.name as campaign_name,
                    o.name as organisation_name,
                    u.id as user_id,
                    u.name as user_name,
                    u.email as user_email,
                    r.name as role_name
                FROM offers off
                    JOIN campaigns c ON c.id = off.campaign_id
                    JOIN organisations o ON o.id = c.organisation_id
                    JOIN applications a ON a.id = off.application_id
                    JOIN users u ON u.id = a.user_id
                    JOIN campaign_roles r ON r.id = off.role_id
                WHERE off.id = $1
            "#,
            id
        )
        .fetch_one(transaction.deref_mut())
        .await?;

        Ok(offer)
    }

    /// Retrieves all offers for a specific campaign.
    /// 
    /// # Arguments
    /// * `campaign_id` - The ID of the campaign to get offers from
    /// * `transaction` - A mutable reference to the database transaction
    /// 
    /// # Returns
    /// Returns a `Result` containing either:
    /// * `Ok(Vec<OfferDetails>)` - List of offers in the campaign
    /// * `Err(ChaosError)` - An error if retrieval fails
    pub async fn get_by_campaign(
        campaign_id: i64,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<Vec<OfferDetails>, ChaosError> {
        let offers = sqlx::query_as!(
            OfferDetails,
            r#"
                SELECT
                    off.id, off.campaign_id, off.application_id, off.email_template_id,
                    off.role_id, off.expiry, off.created_at,
                    off.status AS "status!: OfferStatus",
                    c.name as campaign_name,
                    o.name as organisation_name,
                    u.id as user_id,
                    u.name as user_name,
                    u.email as user_email,
                    r.name as role_name
                FROM offers off
                    JOIN campaigns c on c.id = off.campaign_id
                    JOIN organisations o on o.id = c.organisation_id
                    JOIN applications a ON a.id = off.application_id
                    JOIN users u on u.id = a.user_id
                    JOIN campaign_roles r on r.id = off.role_id
                WHERE off.id = $1
            "#,
            campaign_id
        )
        .fetch_all(transaction.deref_mut())
        .await?;

        Ok(offers)
    }

    /// Deletes an offer.
    /// 
    /// # Arguments
    /// * `id` - The ID of the offer to delete
    /// * `transaction` - A mutable reference to the database transaction
    /// 
    /// # Returns
    /// Returns a `Result` containing either:
    /// * `Ok(())` - If the offer was deleted successfully
    /// * `Err(ChaosError)` - An error if deletion fails
    pub async fn delete(
        id: i64,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<(), ChaosError> {
        let _ = sqlx::query!("DELETE FROM offers WHERE id = $1 RETURNING id", id)
            .fetch_one(transaction.deref_mut())
            .await?;

        Ok(())
    }

    /// Processes a response to an offer.
    /// 
    /// # Arguments
    /// * `id` - The ID of the offer to respond to
    /// * `accept` - Whether the offer is being accepted
    /// * `transaction` - A mutable reference to the database transaction
    /// 
    /// # Returns
    /// Returns a `Result` containing either:
    /// * `Ok(())` - If the response was processed successfully
    /// * `Err(ChaosError)` - An error if processing fails
    /// 
    /// # Note
    /// This will fail if the offer has expired.
    pub async fn reply(
        id: i64,
        accept: bool,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<(), ChaosError> {
        let offer = Offer::get(id, transaction).await?;

        if Utc::now() > offer.expiry {
            return Err(ChaosError::BadRequest);
        }

        let mut status = OfferStatus::Accepted;
        if !accept {
            status = OfferStatus::Declined;
        }

        let _ = sqlx::query!(
            "UPDATE offers SET status = $2 WHERE id = $1",
            id,
            status as OfferStatus
        )
        .execute(transaction.deref_mut())
        .await?;

        Ok(())
    }

    /// Generates a preview of the offer email.
    /// 
    /// # Arguments
    /// * `id` - The ID of the offer to preview
    /// * `transaction` - A mutable reference to the database transaction
    /// 
    /// # Returns
    /// Returns a `Result` containing either:
    /// * `Ok(EmailParts)` - The generated email subject and body
    /// * `Err(ChaosError)` - An error if generation fails
    pub async fn preview_email(
        id: i64,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<EmailParts, ChaosError> {
        let offer = Offer::get(id, transaction).await?;
        let email_parts = EmailTemplate::generate_email(
            offer.user_name,
            offer.role_name,
            offer.organisation_name,
            offer.campaign_name,
            offer.expiry,
            offer.email_template_id,
            transaction,
        )
        .await?;

        Ok(email_parts)
    }

    /// Sends an offer email to the applicant.
    /// 
    /// # Arguments
    /// * `id` - The ID of the offer to send
    /// * `transaction` - A mutable reference to the database transaction
    /// * `email_credentials` - The credentials to use for sending email
    /// 
    /// # Returns
    /// Returns a `Result` containing either:
    /// * `Ok(())` - If the email was sent successfully
    /// * `Err(ChaosError)` - An error if sending fails
    pub async fn send_offer(
        id: i64,
        transaction: &mut Transaction<'_, Postgres>,
        email_credentials: EmailCredentials,
    ) -> Result<(), ChaosError> {
        let offer = Offer::get(id, transaction).await?;
        let email_parts = EmailTemplate::generate_email(
            offer.user_name.clone(),
            offer.role_name,
            offer.organisation_name,
            offer.campaign_name,
            offer.expiry,
            offer.email_template_id,
            transaction,
        )
        .await?;

        ChaosEmail::send_message(
            offer.user_name,
            offer.user_email,
            email_parts.subject,
            email_parts.body,
            email_credentials,
        )
        .await?;
        Ok(())
    }
}
