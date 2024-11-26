use std::collections::HashMap;
use std::ops::DerefMut;
use chrono::{DateTime, Local, Utc};
use handlebars::Handlebars;
use serde::{Deserialize, Serialize};
use snowflake::SnowflakeIdGenerator;
use sqlx::{Pool, Postgres, Transaction};
use crate::models::application::Application;
use crate::models::campaign::Campaign;
use crate::models::error::ChaosError;

/// Email templates to update applicants
/// Supported tags:
///  - `name`
///  - `role`
///  - `organisation_name`
///  - `expiry_date`
///  - `campaign_name`
#[derive(Deserialize, Serialize)]
pub struct EmailTemplate {
    pub id: i64,
    pub organisation_id: i64,
    pub name: String,
    pub template: String,
}

impl EmailTemplate {
    pub async fn get(id: i64, transaction: &mut Transaction<'_, Postgres>) -> Result<EmailTemplate, ChaosError> {
        let template = sqlx::query_as!(
            EmailTemplate,
            "SELECT * FROM email_templates WHERE id = $1",
            id
        )
            .fetch_one(transaction.deref_mut()).await?;

        Ok(template)
    }

    pub async fn get_all_by_organisation(organisation_id: i64, pool: &Pool<Postgres>) -> Result<Vec<EmailTemplate>, ChaosError> {
        let templates = sqlx::query_as!(
            EmailTemplate,
            "SELECT * FROM email_templates WHERE organisation_id = $1",
            organisation_id
        )
            .fetch_all(pool).await?;

        Ok(templates)
    }

    pub async fn update(id: i64, name: String, template: String, pool: &Pool<Postgres>) -> Result<(), ChaosError> {
        let _ = sqlx::query!(
            "
                UPDATE email_templates SET name = $2, template = $3 WHERE id = $1 RETURNING id
            ",
            id, name, template
        )
            .fetch_one(pool).await?;

        Ok(())
    }

    pub async fn delete(id: i64, pool: &Pool<Postgres>) -> Result<(), ChaosError> {
        let _ = sqlx::query!(
            "DELETE FROM email_templates WHERE id = $1 RETURNING id",
            id
        ).fetch_one(pool).await?;

        Ok(())
    }

    pub async fn generate_email(
        name: String,
        role: String,
        organisation_name: String,
        campaign_name: String,
        expiry_date: DateTime<Utc>,
        email_template_id: i64,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<String, ChaosError> {
        let template = EmailTemplate::get(email_template_id, transaction).await?;

        let mut handlebars = Handlebars::new();
        handlebars.register_template_string("template", template.template)?;

        let mut data = HashMap::new();
        data.insert("name", name);
        data.insert("role", role);
        data.insert("organisation_name", organisation_name);
        data.insert("campaign_name", campaign_name);
        data.insert("expiry_date", expiry_date.with_timezone(&Local).format("%d/%m/%Y %H:%M").to_string());

        let final_string = handlebars.render("template", &data)?;

        Ok(final_string)
    }
}