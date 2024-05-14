use anyhow::{bail, Result};
use sqlx::{Pool, Postgres};
use crate::models::user::User;

// 1. function to read all data of the user
pub async fn get_user(id: i64, pool: Pool<Postgres>) -> Result<User> {
    // fetch username from database 
    let possible_username = sqlx::query!("SELECT * FROM users WHERE id = $1", id)
        .fetch_optional(&pool)
        .await?;

    if let Some(result) = possible_username {
        return Ok({
            id: i64::from(result.id),
            email: String::from(result.email),
            zid: String::from(result.zid),
            name: String::from(result.name),
            degree_name: String::from(result.degree_name),
            degree_starting_year: i64::from(result.degree_starting_year),
            role: String::from(result.role)
        });
    }

    // error handling - NEED TO UPDATE
    bail!("error");
}


// 2. Update the user with new details

pub async fn update_user(id: i64, zid?: String, degree_name?: String, degree_starting_year?: i64) -> Result<i64> {
    
    Ok(1)

}

// 4. Delete - delete user