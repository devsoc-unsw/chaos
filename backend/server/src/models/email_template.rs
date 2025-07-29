//! Email template management for Chaos.
//! 
//! This module provides functionality for managing email templates with support
//! for variable substitution using Handlebars templating.

use crate::models::email::EmailParts;
use crate::models::error::ChaosError;
use chrono::{DateTime, Local, Utc};
use handlebars::Handlebars;
use serde::{Deserialize, Serialize};
use sqlx::{Pool, Postgres, Transaction};
use std::collections::HashMap;
use std::ops::DerefMut;

/// Represents an email template in the database.
/// 
/// Email templates support the following variables in their subject and body:
/// * `name` - The recipient's name
/// * `role` - The role being applied for
/// * `organisation_name` - The name of the organisation
/// * `expiry_date` - The expiration date of the application/offer
/// * `campaign_name` - The name of the recruitment campaign
#[derive(Deserialize, Serialize)]
pub struct EmailTemplate {
    /// Unique identifier for the template
    pub id: i64,
    /// ID of the organisation that owns this template
    pub organisation_id: i64,
    /// Display name of the template
    pub name: String,
    /// Template for the email subject line
    pub template_subject: String,
    /// Template for the email body content
    pub template_body: String,
}

/// Data structure for creating a new email template.
/// 
/// This struct contains the fields needed to create a new email template,
/// excluding the ID and organisation ID which are managed by the system.
#[derive(Deserialize, Serialize)]
pub struct NewEmailTemplate {
    /// Display name of the template
    pub name: String,
    /// Template for the email subject line
    pub template_subject: String,
    /// Template for the email body content
    pub template_body: String,
}

impl EmailTemplate {
    /// Retrieves an email template by its ID.
    /// 
    /// # Arguments
    /// * `id` - The ID of the template to retrieve
    /// * `transaction` - A mutable reference to the database transaction
    /// 
    /// # Returns
    /// Returns a `Result` containing either:
    /// * `Ok(EmailTemplate)` - The requested template
    /// * `Err(ChaosError)` - An error if retrieval fails
    pub async fn get(
        id: i64,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<EmailTemplate, ChaosError> {
        let template = sqlx::query_as!(
            EmailTemplate,
            "SELECT * FROM email_templates WHERE id = $1",
            id
        )
        .fetch_one(transaction.deref_mut())
        .await?;

        Ok(template)
    }

    /// Retrieves all email templates for a specific organisation.
    /// 
    /// # Arguments
    /// * `organisation_id` - The ID of the organisation
    /// * `pool` - A reference to the database connection pool
    /// 
    /// # Returns
    /// Returns a `Result` containing either:
    /// * `Ok(Vec<EmailTemplate>)` - List of templates for the organisation
    /// * `Err(ChaosError)` - An error if retrieval fails
    pub async fn get_all_by_organisation(
        organisation_id: i64,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<Vec<EmailTemplate>, ChaosError> {
        let templates = sqlx::query_as!(
            EmailTemplate,
            "SELECT * FROM email_templates WHERE organisation_id = $1",
            organisation_id
        )
        .fetch_all(transaction.deref_mut())
        .await?;

        Ok(templates)
    }

    /// Updates an existing email template.
    /// 
    /// # Arguments
    /// * `id` - The ID of the template to update
    /// * `name` - The new name for the template
    /// * `template_subject` - The new subject template
    /// * `template_body` - The new body template
    /// * `pool` - A reference to the database connection pool
    /// 
    /// # Returns
    /// Returns a `Result` containing either:
    /// * `Ok(())` - If the update was successful
    /// * `Err(ChaosError)` - An error if the update fails
    pub async fn update(
        id: i64,
        name: String,
        template_subject: String,
        template_body: String,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<(), ChaosError> {
        let _ = sqlx::query!(
            "
                UPDATE email_templates SET name = $2, template_subject = $3, template_body = $4 WHERE id = $1 RETURNING id
            ",
            id,
            name,
            template_subject,
            template_body
        )
        .fetch_one(transaction.deref_mut())
        .await?;

        Ok(())
    }

    /// Deletes an email template.
    /// 
    /// # Arguments
    /// * `id` - The ID of the template to delete
    /// * `pool` - A reference to the database connection pool
    /// 
    /// # Returns
    /// Returns a `Result` containing either:
    /// * `Ok(())` - If the deletion was successful
    /// * `Err(ChaosError)` - An error if the deletion fails
    pub async fn delete(id: i64, transaction: &mut Transaction<'_, Postgres>,) -> Result<(), ChaosError> {
        let _ = sqlx::query!("DELETE FROM email_templates WHERE id = $1 RETURNING id", id)
            .fetch_one(transaction.deref_mut())
            .await?;

        Ok(())
    }

    /// Generates an email using a template and provided data.
    /// 
    /// # Arguments
    /// * `name` - The recipient's name
    /// * `role` - The role being applied for
    /// * `organisation_name` - The name of the organisation
    /// * `campaign_name` - The name of the recruitment campaign
    /// * `expiry_date` - The expiration date of the application/offer
    /// * `email_template_id` - The ID of the template to use
    /// * `transaction` - A mutable reference to the database transaction
    /// 
    /// # Returns
    /// Returns a `Result` containing either:
    /// * `Ok(EmailParts)` - The generated email subject and body
    /// * `Err(ChaosError)` - An error if generation fails
    pub async fn generate_email(
        name: String,
        role: String,
        organisation_name: String,
        campaign_name: String,
        expiry_date: DateTime<Utc>,
        email_template_id: i64,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<EmailParts, ChaosError> {
        let template = EmailTemplate::get(email_template_id, transaction).await?;

        let mut handlebars = Handlebars::new();
        handlebars.register_template_string("template_subject", template.template_subject)?;
        handlebars.register_template_string("template_body", template.template_body)?;

        let mut data = HashMap::new();
        data.insert("name", name);
        data.insert("role", role);
        data.insert("organisation_name", organisation_name);
        data.insert("campaign_name", campaign_name);
        data.insert(
            "expiry_date",
            expiry_date
                .with_timezone(&Local)
                .format("%d/%m/%Y %H:%M")
                .to_string(),
        );

        let subject = handlebars.render("template_subject", &data)?;
        let body = handlebars.render("template_body", &data)?;

        Ok(EmailParts { subject, body })
    }
}
