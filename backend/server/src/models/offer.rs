use std::ops::DerefMut;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use snowflake::SnowflakeIdGenerator;
use sqlx::{Postgres, Transaction};
use crate::models::application::Application;
use crate::models::campaign::Campaign;
use crate::models::email_template::EmailTemplate;
use crate::models::error::ChaosError;

#[derive(Deserialize)]
pub struct Offer {
    pub id: i64,
    pub campaign_id: i64,
    pub application_id: i64,
    pub email_template_id: i64,
    pub role_id: i64,
    pub expiry: DateTime<Utc>,
    pub status: OfferStatus,
    pub created_at: DateTime<Utc>,
}

#[derive(Deserialize, Serialize)]
pub struct OfferDetails {
    pub id: i64,
    pub campaign_id: i64,
    pub organisation_name: String,
    pub campaign_name: String,
    pub application_id: i64,
    pub user_id: i64,
    pub user_name: String,
    pub user_email: String,
    pub email_template_id: i64,
    pub role_id: i64,
    pub role_name: String,
    pub expiry: DateTime<Utc>,
    pub status: OfferStatus,
    pub created_at: DateTime<Utc>,
}

#[derive(Deserialize, Serialize, sqlx::Type, Clone, Debug)]
#[sqlx(type_name = "offer_status", rename_all = "PascalCase")]
pub enum OfferStatus {
    Draft,
    Sent,
    Accepted,
    Declined
}

#[derive(Deserialize)]
pub struct OfferReply {
    pub accept: bool,
}

impl Offer {
    pub async fn create(campaign_id: i64, application_id: i64, email_template_id: i64, role_id: i64, expiry: DateTime<Utc>, transaction: &mut Transaction<'_, Postgres>, mut snowflake_id_generator: SnowflakeIdGenerator) -> Result<i64, ChaosError> {
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

    pub async fn get(id: i64, transaction: &mut Transaction<'_, Postgres>) -> Result<OfferDetails, ChaosError> {
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

    pub async fn get_by_campaign(campaign_id: i64, transaction: &mut Transaction<'_, Postgres>) -> Result<Vec<OfferDetails>, ChaosError> {
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

    pub async fn delete(id: i64, transaction: &mut Transaction<'_, Postgres>) -> Result<(), ChaosError> {
        let _ = sqlx::query!("DELETE FROM offers WHERE id = $1 RETURNING id", id)
            .fetch_one(transaction.deref_mut())
            .await?;

        Ok(())
    }

    pub async fn reply(id: i64, accept: bool, transaction: &mut Transaction<'_, Postgres>) -> Result<(), ChaosError> {
        let offer = Offer::get(id, transaction).await?;

        if Utc::now() > offer.expiry {
            return Err(ChaosError::BadRequest)
        }

        let mut status = OfferStatus::Accepted;
        if !accept {
            status = OfferStatus::Declined;
        }

        let _ = sqlx::query!("UPDATE offers SET status = $2 WHERE id = $1", id, status as OfferStatus)
            .execute(transaction.deref_mut())
            .await?;

        Ok(())
    }

    pub async fn preview_email(id: i64, transaction: &mut Transaction<'_, Postgres>) -> Result<String, ChaosError> {
        let offer = Offer::get(id, transaction).await?;
        let email = EmailTemplate::generate_email(offer.user_name, offer.role_name, offer.organisation_name, offer.campaign_name, offer.expiry, offer.email_template_id, transaction).await?;
        Ok(email)
    }

    pub async fn send_offer(id: i64, transaction: &mut Transaction<'_, Postgres>) -> Result<(), ChaosError> {
        let offer = Offer::get(id, transaction).await?;
        let email = EmailTemplate::generate_email(offer.user_name, offer.role_name, offer.organisation_name, offer.campaign_name, offer.expiry, offer.email_template_id, transaction).await?;

        // TODO: Send email e.g. send_email(offer.user_email, email).await?;
        Ok(())
    }
}