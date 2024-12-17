use crate::models::error::ChaosError;
use serde::{Deserialize, Serialize};
use sqlx::{FromRow, Pool, Postgres};

#[derive(Deserialize, Serialize, sqlx::Type, Clone)]
#[sqlx(type_name = "user_role", rename_all = "PascalCase")]
pub enum UserRole {
    User,
    SuperUser,
}

#[derive(Deserialize, Serialize, FromRow)]
pub struct UserDetails {
    pub id: i64,
    pub email: String,
    pub zid: Option<String>,
    pub name: String,
    pub pronouns: String,
    pub gender: String,
    pub degree_name: Option<String>,
    pub degree_starting_year: Option<i32>,
}

#[derive(Deserialize, Serialize, FromRow)]
pub struct User {
    pub id: i64,
    pub email: String,
    pub zid: Option<String>,
    pub name: String,
    pub pronouns: String,
    pub gender: String,
    pub degree_name: Option<String>,
    pub degree_starting_year: Option<i32>,
    pub role: UserRole,
}

#[derive(Deserialize, Serialize)]
pub struct UserName {
    pub name: String,
}

#[derive(Deserialize, Serialize)]
pub struct UserPronouns {
    pub pronouns: String,
}

#[derive(Deserialize, Serialize)]
pub struct UserGender {
    pub gender: String,
}

#[derive(Deserialize, Serialize)]
pub struct UserZid {
    pub zid: String,
}

#[derive(Deserialize, Serialize)]
pub struct UserDegree {
    pub degree_name: String,
    pub degree_starting_year: i32,
}

impl User {
    pub async fn get(id: i64, pool: &Pool<Postgres>) -> Result<User, ChaosError> {
        let user = sqlx::query_as!(
            User,
            r#"
            SELECT id, email, zid, name, pronouns, gender, degree_name,
            degree_starting_year, role AS "role!: UserRole"
            FROM users WHERE id = $1
        "#,
            id
        )
        .fetch_one(pool)
        .await?;

        Ok(user)
    }

    pub async fn update_name(
        id: i64,
        name: String,
        pool: &Pool<Postgres>,
    ) -> Result<(), ChaosError> {
        let _ = sqlx::query!(
            "
            UPDATE users SET name = $1 WHERE id = $2 RETURNING id
        ",
            name,
            id
        )
        .fetch_one(pool)
        .await?;

        Ok(())
    }

    pub async fn update_pronouns(
        id: i64,
        pronouns: String,
        pool: &Pool<Postgres>,
    ) -> Result<(), ChaosError> {
        let _ = sqlx::query!(
            "
            UPDATE users SET pronouns = $1 WHERE id = $2 RETURNING id
        ",
            pronouns,
            id
        )
        .fetch_one(pool)
        .await?;

        Ok(())
    }

    pub async fn update_gender(
        id: i64,
        gender: String,
        pool: &Pool<Postgres>,
    ) -> Result<(), ChaosError> {
        let _ = sqlx::query!(
            "
            UPDATE users SET gender = $1 WHERE id = $2 RETURNING id
        ",
            gender,
            id
        )
        .fetch_one(pool)
        .await?;

        Ok(())
    }

    pub async fn update_zid(id: i64, zid: String, pool: &Pool<Postgres>) -> Result<(), ChaosError> {
        let _ = sqlx::query!(
            "
            UPDATE users SET zid = $1 WHERE id = $2 RETURNING id
        ",
            zid,
            id
        )
        .fetch_one(pool)
        .await?;

        Ok(())
    }

    pub async fn update_degree(
        id: i64,
        degree_name: String,
        degree_starting_year: i32,
        pool: &Pool<Postgres>,
    ) -> Result<(), ChaosError> {
        let _ = sqlx::query!(
            "
            UPDATE users SET degree_name = $1, degree_starting_year = $2 WHERE id = $3 RETURNING id
        ",
            degree_name,
            degree_starting_year,
            id
        )
        .fetch_one(pool)
        .await?;

        Ok(())
    }
}
