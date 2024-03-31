use anyhow::{bail, Result};
use sqlx::{types::time::{OffsetDateTime, PrimitiveDateTime}, Pool, Postgres};

pub async fn get_organisations(pool: Pool<Postgres>) -> Result<Vec<String>> {
    let organisations = sqlx::query!("SELECT * FROM organisations")
        .fetch_all(&pool)
        .await?;

    let mut name_list: Vec<String> = Vec::new();

    for organisation in organisations {
        name_list.push(organisation.name);
    }

    Ok(name_list)
}


pub async fn get_organisation(id: i64, pool: Pool<Postgres>) -> Result<String> {
    let org_name = sqlx::query!
    (
        "
            SELECT *
                FROM organisations
                WHERE id = $1
        ",
        id).fetch_optional(&pool)
        .await?;

    if let Some(result) = org_name {
        return Ok(result.name);
    }

    bail!("error: failed to get organisation");
}

pub async fn update_organisation(id: i64, name: Option<String>, logo: Option<String>, pool: Pool<Postgres>) -> Result<String> {
    let current_time = OffsetDateTime::now_utc();
    let primitive_time = PrimitiveDateTime::new(current_time.date(), current_time.time());
    let updated_organisation = sqlx::query!
    (
        "
            UPDATE organisations
                SET name = $2, logo = $3, updated_at = $4
                WHERE id = $1
                RETURNING *
        ",
        id,
        name,
        logo,
        primitive_time
    ).fetch_one(&pool)
    .await;

    match updated_organisation {
        Ok(_) => {
            println!("{:?}", updated_organisation);
            return Ok("done".to_string())
        },
        Err(_) => bail!("error: Failed to update organisation")
    }
}

pub async fn delete_organisation(organisation_id: i64, admin_id: i64, pool: Pool<Postgres>) -> Result<String> {
   // Delete all organisation_admins with the corresponding organisation_id
   let deleted_users = sqlx::query!
    (
        "
            WITH user_exists AS (
                SELECT 1 AS exists_flag
                FROM organisation_admins
                WHERE organisation_id = $1
                AND user_id = $2
                LIMIT 1
            )
            DELETE FROM organisation_admins
                WHERE organisation_id = $1
                AND EXISTS (
                    SELECT 1
                    FROM user_exists
                )
                RETURNING *
        ",
        organisation_id,
        admin_id
   ).fetch_one(&pool)
   .await;

   match deleted_users {
        Ok(_) => {
            println!("{:?}", deleted_users);
        },
        Err(_) => bail!("error: user is not an admin of the organisation")
   }

   
   // Delete organisation
   let deleted_organisation = sqlx::query!
   (
        "
            DELETE FROM organisations WHERE id = $1
                RETURNING *
        ",
        organisation_id
    ).fetch_one(&pool)
    .await;

  match deleted_organisation {
    Ok(_) => {
        println!("{:?}", deleted_organisation);
        Ok("Delete organisation and all the admins from database".to_string())
    },
    Err(_) => bail!("error: user is not an admin of the organisation")
}

}

pub async fn create_organisation(id: i64, name: String, logo: Option<String>, pool: Pool<Postgres>) -> Result<String> {
    let new_organisation = sqlx::query!
    (
        "
            INSERT INTO organisations (id, name, logo)
                VALUES ($1, $2, $3)
                RETURNING *
        ",
        id,
        name,
        logo
    ).fetch_one(&pool).await;

    match new_organisation {
        Ok(_) => {
            println!("{:?}", new_organisation);
            Ok("Created new organisation in database".to_string())
        },
        Err(_) => bail!("error: failed to create organisation")
    }
}

pub async fn get_organisation_admins(organisation_id: i64, pool: Pool<Postgres>) -> Result<Vec<i64>> {
    let admin_list = sqlx::query!
    (
        "
            SELECT user_id
                FROM organisation_admins
                WHERE organisation_id = $1
        "
        , organisation_id
    ).fetch_all(&pool).await?;

    let mut admin_id_list: Vec<i64> = Vec::new();

    for admin in admin_list {
        admin_id_list.push(admin.user_id);
    }

    Ok(admin_id_list)
}

pub async fn add_admin_to_organisation(organisation_id: i64, admin_id: i64, pool: Pool<Postgres>) -> Result<String> {
    let new_organisation_admin = sqlx::query!
    (
        "
            INSERT INTO organisation_admins
                (organisation_id, user_id)
                VALUES ($1, $2)
                RETURNING *
        ",
        organisation_id,
        admin_id
    ).fetch_one(&pool).await;

    match new_organisation_admin {
        Ok(_) => {
            println!("{:?}", new_organisation_admin);
            Ok("Created new organisation admin in database".to_string())
        },
        Err(_) => bail!("error: failed to add admin to organisation")
    }
}

pub async fn remove_admin_from_organisation(organisation_id: i64, admin_id: i64, pool: Pool<Postgres>) -> Result<String> {
    let new_organisation_admin = sqlx::query!
    (
        "
            DELETE FROM organisation_admins
                WHERE organisation_id = $1
                AND user_id = $2
                RETURNING *
        ",
        organisation_id,
        admin_id
    ).fetch_one(&pool).await;

    match new_organisation_admin {
        Ok(_) => {
            println!("{:?}", new_organisation_admin);
            Ok("Deleted organisation admin in database".to_string())
        },
        Err(_) => bail!("error: failed to remove admin from organisation")
    }
}