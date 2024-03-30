use anyhow::{bail, Result};
use sqlx::{Pool, Postgres};
use chrono::Utc;

pub async fn get_organisation_name(id: i64, pool: Pool<Postgres>) -> Result<String> {
    let organisation_name = sqlx::query!("SELECT name FROM organisations WHERE id = $1", id)
        .fetch_optional(&pool)
        .await?;

    if let Some(result) = organisation_name {
        Ok(result.name)
    }

    bail!("error");
}

pub async fn get_organisation(id: i64, email: String, pool: Pool<Postgres>) -> Result<String> {
    let org_name = sqlx::query!("SELECT * FROM organisations WHERE id = $1", id)
        .fetch_optional(&pool)
        .await?;

    if let Some(result) = org_name {
        Ok(result.name)
    }

    bail!("error");
}

pub async fn update_organisation(id: i64, name: Option<String>, logo: Option<String>, pool: Pool<Postgres>) -> Result<String> {
    let mut query = String::from("UPDATE organisations SET ");
    let mut name_exists = false;

    if let Some(name) = name {
        query.push_str("name = $2");
        name_exists = true;
    }

    if let Some(logo) = logo {
        if name_exists {
            query.push_str(", ");
        }
        query.push_str("logo = $3");
    }

    query.push_str(", updated_at = $");
    query.push_str(" WHERE id = $1");

    // This is under the assumption that Postgres will updated updated_at itself?
    let rows_affected = sqlx::query!(
        &query,
        id,
        name,
        logo
        Utc::now()
    )
    .execute(&pool)
    .await?;

    if let Some(rows_affected) = rows_affected {
        Ok(rows_affected)
    }

    bail!("error: failed to update organisation")
}

pub async fn delete_organisation(organisation_id: i64, admin_id: i64, pool: &sqlx::Pool<Postgres>) -> Result<String> {
    let query = "
        DELETE FROM organisations 
        WHERE id = $1 
        AND EXISTS (
            SELECT 1 FROM organisation_admins 
            WHERE organisation_id = $1 AND user_id = $2
        )";

    let deleted_organisation = sqlx::query!(
        &query,
        organisation_id,
        admin_id,
        Utc::now()
    )
    .execute(&pool)
    .await?;

    if let Some(deleted_organisation) = deleted_organisation {
        Ok(deleted_organisation)
    }

    bail!("error: failed to delete organisation")
}

pub async fn create_organisation(name: String, logo: Option<String>) -> Result<String> {
    let query = if logo.is_some() {
        "INSERT INTO organisations (name, logo) VALUES ($1, $2)"
    } else {
        "INSERT INTO organisations (name) VALUES ($1)"
    };

    let new_organisation = if let Some(logo) = logo {
        sqlx::query!(
            &query,
            name,
            logo
        )
        .execute(&pool)
        .await?
    } else {
        sqlx::query!(
            &query,
            name,
        )
        .execute(&pool)
        .await?
    };

    if let Some(new_organisation) = new_organisation {
        Ok(new_organisation)
    }

    bail!("error: failed to create organisation")
}