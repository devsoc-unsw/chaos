use anyhow::{bail, Result};
use sqlx::{Pool, Postgres};
use chrono::Utc;

pub async fn get_organisation_name(id: i64, pool: Pool<Postgres>) -> Result<String> {
    let organisation_name = sqlx::query!("SELECT name FROM organisations WHERE id = $1", id)
        .fetch_optional(&pool)
        .await?;

    if let Some(result) = organisation_name {
        return Ok(result.name);
    }

    bail!("error");
}

pub async fn get_organisation(id: i64, pool: Pool<Postgres>) -> Result<String> {
    let org_name = sqlx::query!("SELECT * FROM organisations WHERE id = $1", id)
        .fetch_optional(&pool)
        .await?;

    if let Some(result) = org_name {
        return Ok(result.name);
    }

    bail!("error");
}

pub async fn update_organisation(id: i64, name: Option<String>, logo: Option<String>, pool: Pool<Postgres>) -> Result<String> {
    let mut query = String::from("UPDATE organisations SET ");
    let mut name_exists = false;

    if name.is_some() {
        query.push_str("name = $2");
        name_exists = true;
    }

    if logo.is_some() {
        if name_exists {
            query.push_str(", ");
        }
        query.push_str("logo = $3");
    }

    query.push_str(", updated_at = $");
    query.push_str(" WHERE id = $1");

    // This is under the assumption that Postgres will updated updated_at itself?
    let updated_organisation = sqlx::query(&query)
        .bind(id)
        .bind(&name)
        .bind(&logo)
        .bind(Utc::now().to_rfc3339())
        .fetch_one(&pool)
        .await;


    match updated_organisation {
        Ok(_) => return Ok("done".to_string()),
        Err(_) => bail!("error: Failed to update organisation")
    }
}

pub async fn delete_organisation(organisation_id: i64, admin_id: i64, pool: Pool<Postgres>) -> Result<String> {
    let deleted_organisation = sqlx::query!("
        DELETE FROM organisations 
        WHERE id = $1 
        AND EXISTS (
            SELECT 1 FROM organisation_admins 
            WHERE organisation_id = $1 AND user_id = $2
        )",
        organisation_id,
        admin_id
    )
    .fetch_optional(&pool)
    .await?;

    if let Some(_deleted_organisation) = deleted_organisation {
        return Ok("done".to_string());
    }

    bail!("error: failed to delete organisation")
}

pub async fn create_organisation(name: String, logo: Option<String>, pool: Pool<Postgres>) -> Result<String> {
    // Here I'm assuming postgres will create a unique id
    let new_organisation = if let Some(logo) = logo {
        sqlx::query!("INSERT INTO organisations (name, logo) VALUES ($1, $2)", name, logo)
        .fetch_optional(&pool)
        .await?
    } else {
        sqlx::query!("INSERT INTO organisations (name) VALUES ($1)", name)
        .fetch_optional(&pool)
        .await?
    };

    if let Some(_new_organisation) = new_organisation {
        return Ok("done".to_string());
    }

    bail!("error: failed to create organisation")
}