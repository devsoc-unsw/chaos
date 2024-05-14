use anyhow::{bail, Result};
use sqlx::{Pool, Postgres};
use crate::models::user::User;

// 1. function to read all data of the user
pub async fn get_user(id: i64, pool: Pool<Postgres>) -> Result<User> {
    // fetch username from database 
    Ok(sqlx::query_as!(
        User,
        "SELECT * FROM users WHERE id = $1", id)
        .fetch_one(&pool)
        .await?)
}


// 2. Update the user with new details

pub async fn update_user(id: i64, zid?: String, degree_name?: String, degree_starting_year?: i64) -> Result<i64> {
    
    Ok(1)

}

// 4. Delete - delete user