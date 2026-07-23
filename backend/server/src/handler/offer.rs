//! Offer handler for the Chaos application.
//!
//! This module provides HTTP request handlers for managing offers, including:
//! - Creating and retrieving offers
//! - Replying to offers
//! - Previewing and sending offer emails
//! - Queuing offer emails for the background worker (`EmailQueue`)

use crate::models::app::{AppMessage, AppState};
use crate::models::auth::{CampaignAdmin, OfferAdmin, OfferRecipient};
use crate::models::email::{EmailQueue, EmailType};
use crate::models::error::ChaosError;
use crate::models::offer::{Offer, OfferReply};
use crate::models::transaction::DBTransaction;
use axum::extract::{Json, Path, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;
use chrono::{DateTime, Utc};
use serde::Deserialize;

/// Handler for offer-related HTTP requests.
pub struct OfferHandler;

/// One outcome email row (subject/body already resolved on the client).
#[derive(Deserialize)]
#[allow(dead_code)]
pub struct QueueOutcomeEmailItem {
    #[serde(default)]
    pub id: Option<String>,
    #[serde(deserialize_with = "crate::models::serde_string::deserialize")]
    pub application_id: i64,
    pub email: String,
    pub name: String,
    #[serde(default)]
    pub role: Option<String>,
    #[serde(deserialize_with = "crate::models::serde_string::deserialize")]
    pub role_id: i64,
    #[serde(deserialize_with = "crate::models::serde_string::deserialize")]
    pub email_template_id: i64,
    pub expiry: DateTime<Utc>,
    pub subject: String,
    pub body: String,
    pub email_type: EmailType,
}

#[derive(Deserialize)]
pub struct QueueOutcomeEmailsRequest {
    pub emails: Vec<QueueOutcomeEmailItem>,
}

impl OfferHandler {
    /// Retrieves the details of a specific offer.
    ///
    /// This handler allows offer admins to view offer details.
    ///
    /// # Arguments
    ///
    /// * `transaction` - Database transaction
    /// * `id` - The ID of the offer to retrieve
    /// * `_user` - The authenticated user (must be an offer admin)
    ///
    /// # Returns
    ///
    /// * `Result<impl IntoResponse, ChaosError>` - Offer details or error
    pub async fn get(
        mut transaction: DBTransaction<'_>,
        Path(id): Path<i64>,
        _user: OfferAdmin,
    ) -> Result<impl IntoResponse, ChaosError> {
        let offer = Offer::get(id, &mut transaction.tx).await?;
        transaction.tx.commit().await?;

        Ok((StatusCode::OK, Json(offer)))
    }

    /// Deletes an offer.
    ///
    /// This handler allows offer admins to delete offers.
    ///
    /// # Arguments
    ///
    /// * `transaction` - Database transaction
    /// * `id` - The ID of the offer to delete
    /// * `_user` - The authenticated user (must be an offer admin)
    ///
    /// # Returns
    ///
    /// * `Result<impl IntoResponse, ChaosError>` - Success message or error
    pub async fn delete(
        mut transaction: DBTransaction<'_>,
        Path(id): Path<i64>,
        _user: OfferAdmin,
    ) -> Result<impl IntoResponse, ChaosError> {
        Offer::delete(id, &mut transaction.tx).await?;
        transaction.tx.commit().await?;

        Ok(AppMessage::OkMessage("Successfully deleted offer"))
    }

    /// Allows a recipient to reply to an offer.
    ///
    /// This handler allows offer recipients to accept or decline offers.
    ///
    /// # Arguments
    ///
    /// * `transaction` - Database transaction
    /// * `id` - The ID of the offer to reply to
    /// * `_user` - The authenticated user (must be the offer recipient)
    /// * `reply` - The recipient's response
    ///
    /// # Returns
    ///
    /// * `Result<impl IntoResponse, ChaosError>` - Success message or error
    pub async fn reply(
        mut transaction: DBTransaction<'_>,
        Path(id): Path<i64>,
        _user: OfferRecipient,
        Json(reply): Json<OfferReply>,
    ) -> Result<impl IntoResponse, ChaosError> {
        Offer::reply(id, reply.accept, &mut transaction.tx).await?;
        transaction.tx.commit().await?;

        Ok(AppMessage::OkMessage("Successfully accepted offer"))
    }

    /// Previews the email that will be sent for an offer.
    ///
    /// This handler allows offer admins to preview the offer email before sending.
    ///
    /// # Arguments
    ///
    /// * `transaction` - Database transaction
    /// * `id` - The ID of the offer
    /// * `_user` - The authenticated user (must be an offer admin)
    ///
    /// # Returns
    ///
    /// * `Result<impl IntoResponse, ChaosError>` - Email preview or error
    pub async fn preview_email(
        mut transaction: DBTransaction<'_>,
        Path(id): Path<i64>,
        _user: OfferAdmin,
    ) -> Result<impl IntoResponse, ChaosError> {
        let email_parts = Offer::preview_email(id, &mut transaction.tx).await?;
        transaction.tx.commit().await?;

        Ok((StatusCode::OK, Json(email_parts)))
    }

    /// Sends an offer email to the recipient.
    ///
    /// This handler allows offer admins to send offer emails.
    ///
    /// # Arguments
    ///
    /// * `transaction` - Database transaction
    /// * `id` - The ID of the offer to send
    /// * `_user` - The authenticated user (must be an offer admin)
    /// * `state` - The application state containing email credentials
    ///
    /// # Returns
    ///
    /// * `Result<impl IntoResponse, ChaosError>` - Success message or error
    pub async fn send_offer(
        mut transaction: DBTransaction<'_>,
        Path(id): Path<i64>,
        _user: OfferAdmin,
        State(state): State<AppState>,
    ) -> Result<impl IntoResponse, ChaosError> {
        Offer::send_offer(id, &mut transaction.tx, state.email_credentials).await?;
        transaction.tx.commit().await?;

        Ok(AppMessage::OkMessage("Successfully sent offer"))
    }

    /// Queues outcome emails for the worker (`EmailQueue`, same pipeline as offer email queue).
    ///
    /// Auth matches viewing application ratings summary: org member for the campaign.
    pub async fn queue_outcome_emails(
        _user: CampaignAdmin,
        Path(campaign_id): Path<i64>,
        mut transaction: DBTransaction<'_>,
        State(mut state): State<AppState>,
        Json(body): Json<QueueOutcomeEmailsRequest>,
    ) -> Result<impl IntoResponse, ChaosError> {
        if body.emails.is_empty() {
            return Err(ChaosError::BadRequestWithMessage(
                "No emails to queue".to_string(),
            ));
        }

        let count = body.emails.len();
        for item in body.emails {
            if matches!(item.email_type, EmailType::Accept) {
                let offer_id = Offer::create(
                    campaign_id,
                    item.application_id,
                    item.email_template_id,
                    item.role_id,
                    item.expiry,
                    &mut transaction.tx,
                    &mut state.snowflake_generator,
                )
                .await?;
                if state.is_dev_env {
                    let email = item.email;
                    println!("need to call offers here, but sent to: {email}");
                } else {
                    Offer::send_offer(
                        offer_id,
                        &mut transaction.tx,
                        state.email_credentials.clone(),
                    )
                    .await?;
                }
            } else {
                if state.is_dev_env {
                    let email = item.email;
                    println!("Sending reject email to {email}");
                } else {
                    EmailQueue::add_to_queue(
                        Some(item.name),
                        item.email,
                        item.subject,
                        item.body,
                        &mut transaction.tx,
                    )
                    .await?;
                }
            }
        }

        transaction.tx.commit().await?;
        Ok(AppMessage::OkMessage(format!(
            "Queued {count} email(s) for delivery"
        )))
    }
}

#[cfg(test)]
mod tests {
    // =========================================================================
    // TEST PLAN – HTTP integration (handler + extractors + auth + DB)
    // =========================================================================
    //
    // Handlers driven through the real Router via oneshot against a #[sqlx::test] DB:
    //   · GET    /api/v1/offer/:offer_id  -> get    (OfferAdmin)
    //   · DELETE /api/v1/offer/:offer_id  -> delete (OfferAdmin = org 'Admin')
    //   · POST   /api/v1/offer/:offer_id  -> reply  (OfferRecipient = applicant)
    //
    //  ID    Scenario                       Expected                          Test
    //  EP01  GET, no auth cookie            401                               get_requires_authentication
    //  EP02  DELETE as org admin            200 + offer removed               admin_can_delete_offer
    //  EP03  POST reply as recipient        200 + status Accepted             recipient_can_accept_offer
    //
    // KNOWN GAPS: preview_email/send_offer render templates and hit SMTP, and
    // queue_outcome_emails drives the email pipeline; none are exercised as they
    // require a live mail transport rather than the inert stub.
    // =========================================================================

    use super::*;
    use crate::test_support::*;
    use axum::http::StatusCode;
    use axum::routing::get;
    use axum::Router;
    use sqlx::PgPool;
    use tower::ServiceExt;

    const OFFER_ID: i64 = 700;

    /// Full offer graph: org 1 (admin user 2), campaign 1, role 1, applicant
    /// user 1 with application 1, email template 1, and a Draft offer 700.
    async fn seed(pool: &PgPool) {
        seed_user(pool, 1, "applicant@test.com").await;
        seed_user(pool, 2, "admin@test.com").await;
        seed_org(pool, 1, "org").await;
        seed_org_member(pool, 1, 2, "Admin").await;
        seed_campaign(pool, 1, 1, true).await;
        seed_role(pool, 1, 1).await;
        seed_application(pool, 1, 1, 1).await;
        sqlx::query(
            "INSERT INTO email_templates (id, organisation_id, name, template_subject, template_body)
             VALUES (1, 1, 'T', 'S', 'B')",
        )
        .execute(pool)
        .await
        .unwrap();
        sqlx::query(
            "INSERT INTO offers (id, campaign_id, application_id, email_template_id, role_id, expiry)
             VALUES ($1, 1, 1, 1, 1, NOW() + INTERVAL '7 day')",
        )
        .bind(OFFER_ID)
        .execute(pool)
        .await
        .unwrap();
    }

    fn router(pool: PgPool) -> Router {
        Router::new()
            .route(
                "/api/v1/offer/:offer_id",
                get(OfferHandler::get)
                    .delete(OfferHandler::delete)
                    .post(OfferHandler::reply),
            )
            .with_state(test_state(pool))
    }

    async fn offer_status(pool: &PgPool) -> Option<String> {
        sqlx::query_scalar("SELECT status::text FROM offers WHERE id = $1")
            .bind(OFFER_ID)
            .fetch_optional(pool)
            .await
            .unwrap()
    }

    /// White-box: viewing an offer requires authentication.
    #[sqlx::test(migrations = "../migrations")]
    async fn get_requires_authentication(pool: PgPool) {
        seed(&pool).await;

        let response = router(pool.clone())
            .oneshot(request("GET", "/api/v1/offer/700", None, None))
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
    }

    /// White-box: an org admin passes OfferAdmin and deletes the offer.
    #[sqlx::test(migrations = "../migrations")]
    async fn admin_can_delete_offer(pool: PgPool) {
        seed(&pool).await;

        let response = router(pool.clone())
            .oneshot(request("DELETE", "/api/v1/offer/700", Some(2), None))
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
        assert_eq!(offer_status(&pool).await, None, "offer should be deleted");
    }

    /// White-box: the applicant (recipient) accepts the offer, moving it to Accepted.
    #[sqlx::test(migrations = "../migrations")]
    async fn recipient_can_accept_offer(pool: PgPool) {
        seed(&pool).await;

        let response = router(pool.clone())
            .oneshot(request(
                "POST",
                "/api/v1/offer/700",
                Some(1),
                Some(serde_json::json!({ "accept": true })),
            ))
            .await
            .unwrap();

        assert_eq!(response.status(), StatusCode::OK);
        assert_eq!(offer_status(&pool).await.as_deref(), Some("Accepted"));
    }
}
