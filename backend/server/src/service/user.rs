use crate::models::user::{User, UserRole};
use anyhow::{bail, Result};
use sqlx::{Pool, Postgres};

pub async fn get_user(id: i64, pool: Pool<Postgres>) -> Result<User> {
    let user = sqlx::query_as!(
        User,
        r#"
                SELECT id, email, zid, name, degree_name,
                degree_starting_year, role AS "role!: UserRole"
                FROM users WHERE id = $1
            "#,
        id
    )
    .fetch_one(&pool)
    .await?;

    Ok(user)
}

pub async fn update_user_name(id: i64, name: String, pool: Pool<Postgres>) -> Result<()> {
    let _ = sqlx::query!(
        "UPDATE users SET name = $1 WHERE id = $2 RETURNING id",
        name,
        id
    )
    .fetch_one(&pool)
    .await?;

    Ok(())
}

pub async fn update_user_zid(id: i64, zid: String, pool: Pool<Postgres>) -> Result<()> {
    let _ = sqlx::query!(
        "UPDATE users SET zid = $1 WHERE id = $2 RETURNING id",
        zid,
        id
    )
    .fetch_one(&pool)
    .await?;

    Ok(())
}

pub async fn update_user_degree_name(
    id: i64,
    degree_name: String,
    pool: Pool<Postgres>,
) -> Result<()> {
    let _ = sqlx::query!(
        "UPDATE users SET degree_name = $1 WHERE id = $2 RETURNING id",
        degree_name,
        id
    )
    .fetch_one(&pool)
    .await?;

    Ok(())
}

pub async fn update_user_degree_starting_year(
    id: i64,
    degree_starting_year: i32,
    pool: Pool<Postgres>,
) -> Result<()> {
    let _ = sqlx::query!(
        "UPDATE users SET degree_starting_year = $1 WHERE id = $2 RETURNING id",
        degree_starting_year,
        id
    )
    .fetch_one(&pool)
    .await?;

    Ok(())
}
