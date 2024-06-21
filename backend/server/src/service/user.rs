use anyhow::{bail, Result};
use sqlx::{Pool, Postgres};
use crate::models::user::User;

// 1. function to read all data of the user
pub async fn get_user(id: i64, pool: Pool<Postgres>) -> Result<User> {
    // fetch username from database 
    Ok(
        sqlx::query_as!(
            User,
            "SELECT * FROM users WHERE id = $1", id)
        .fetch_one(&pool)
        .await?)
}


// 2. Update the user with new details

pub async fn update_user_zid(id: i64, zid: String, pool: Pool<Postgres>) -> Result<i64> {
    
    let possible_user = sqlx::query!("SELECT * FROM users id = $1", id)
    .fetch_one(&pool)
    .await?;

    if possible_user.is_none() {
        bail!("User with id {} does not exist", id);
    }

    if let zid = zid {
        sqlx::query!("UPDATE users SET zid = $1 WHERE id = $2", zid, id)
            .execute(&pool)
            .await;
    }

    if let Some(degree_name) = degree_name {
        sqlx::query!("UPDATE users SET degree_name = $1 WHERE id = $2", degree_name, id)
            .execute(&pool)
            .await;
    }

    if let Some(degree_starting_year) = degree_starting_year {
        sqlx::query!("UPDATE users SET degree_name = $1 WHERE id = $2", degree_starting_year, id)
            .execute(&pool)
            .await;
    }

    Ok(possible_user)

}

