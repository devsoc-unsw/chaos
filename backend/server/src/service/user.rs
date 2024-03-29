use anyhow::{bail, Result};
use sqlx::{Pool, Postgres};

// security 
// 1. function to read just the username
// Used when other users try to read the name of a user
pub async fn get_username(id: i64, pool: Pool<Postgres>) -> Result<String> {
    // fetch username from database 
    let possible_username = sqlx::query!("SELECT name FROM users WHERE id = $1", id)
        .fetch_optional(&pool)
        .await?;

    if let Some(result) = possible_username {
        return Ok(result.name);
    }

    // error handling - NEED TO UPDATE
    bail!("error");
}

// 2. function to read all data of the user
pub async fn get_user(id: i64, email: String) -> Result<i64> {
    Ok(1)
}


// 3. Update - 
pub async fn update_user(id: i64, email: String) -> Result<i64> {
    
    Ok(1)

}

// 4. Delete - delete user