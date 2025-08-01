//! User management module for the Chaos application.
//! 
//! This module provides functionality for managing users, including retrieval
//! and updating of user information such as name, pronouns, gender, zID, and degree details.

use crate::models::error::ChaosError;
use serde::{Deserialize, Serialize};
use sqlx::{FromRow, Pool, Postgres, Transaction};
use std::ops::DerefMut;

/// Represents the role of a user in the system.
/// 
/// Users can have different roles that determine their permissions and access levels.
#[derive(Deserialize, Serialize, sqlx::Type, Clone)]
#[sqlx(type_name = "user_role", rename_all = "PascalCase")]
pub enum UserRole {
    /// Regular user with basic access
    User,
    /// Super user with administrative privileges
    SuperUser,
}

/// Detailed information about a user.
/// 
/// This struct contains all the personal and academic information about a user
/// that can be displayed in the application.
#[derive(Deserialize, Serialize, FromRow)]
pub struct UserDetails {
    /// Unique identifier for the user
    pub id: i64,
    /// User's email address
    pub email: String,
    /// User's zID (UNSW student ID)
    pub zid: Option<String>,
    /// User's full name
    pub name: String,
    /// User's preferred pronouns
    pub pronouns: Option<String>,
    /// User's gender
    pub gender: Option<String>,
    /// User's degree name
    pub degree_name: Option<String>,
    /// Year the user started their degree
    pub degree_starting_year: Option<i32>,
}

/// Complete user information including role.
/// 
/// This struct extends UserDetails to include the user's role in the system.
#[derive(Deserialize, Serialize, FromRow)]
pub struct User {
    /// Unique identifier for the user
    pub id: i64,
    /// User's email address
    pub email: String,
    /// User's zID (UNSW student ID)
    pub zid: Option<String>,
    /// User's full name
    pub name: String,
    /// User's preferred pronouns
    pub pronouns: Option<String>,
    /// User's gender
    pub gender: Option<String>,
    /// User's degree name
    pub degree_name: Option<String>,
    /// Year the user started their degree
    pub degree_starting_year: Option<i32>,
    /// User's role in the system
    pub role: UserRole,
}

/// Data structure for updating a user's name.
#[derive(Deserialize, Serialize)]
pub struct UserName {
    /// New name for the user
    pub name: String,
}

/// Data structure for updating a user's pronouns.
#[derive(Deserialize, Serialize)]
pub struct UserPronouns {
    /// New pronouns for the user
    pub pronouns: String,
}

/// Data structure for updating a user's gender.
#[derive(Deserialize, Serialize)]
pub struct UserGender {
    /// New gender for the user
    pub gender: String,
}

/// Data structure for updating a user's zID.
#[derive(Deserialize, Serialize)]
pub struct UserZid {
    /// New zID for the user
    pub zid: String,
}

/// Data structure for updating a user's degree information.
#[derive(Deserialize, Serialize)]
pub struct UserDegree {
    /// New degree name for the user
    pub degree_name: String,
    /// New degree starting year for the user
    pub degree_starting_year: i32,
}

impl User {
    /// Retrieves a user by their ID.
    /// 
    /// # Arguments
    /// 
    /// * `id` - ID of the user to retrieve
    /// * `pool` - Database connection pool
    /// 
    /// # Returns
    /// 
    /// * `Result<User, ChaosError>` - User details or error
    pub async fn get(id: i64, transaction: &mut Transaction<'_, Postgres>,) -> Result<User, ChaosError> {
        let user = sqlx::query_as!(
            User,
            r#"
            SELECT id, email, zid, name, pronouns, gender, degree_name,
            degree_starting_year, role AS "role!: UserRole"
            FROM users WHERE id = $1
        "#,
            id
        )
        .fetch_one(transaction.deref_mut())
        .await?;

        Ok(user)
    }

    /// Updates a user's name.
    /// 
    /// # Arguments
    /// 
    /// * `id` - ID of the user to update
    /// * `name` - New name for the user
    /// * `pool` - Database connection pool
    /// 
    /// # Returns
    /// 
    /// * `Result<(), ChaosError>` - Success or error
    pub async fn update_name(
        id: i64,
        name: String,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<(), ChaosError> {
        let _ = sqlx::query!(
            "
            UPDATE users SET name = $1 WHERE id = $2 RETURNING id
        ",
            name,
            id
        )
        .fetch_one(transaction.deref_mut())
        .await?;

        Ok(())
    }

    /// Updates a user's pronouns.
    /// 
    /// # Arguments
    /// 
    /// * `id` - ID of the user to update
    /// * `pronouns` - New pronouns for the user
    /// * `pool` - Database connection pool
    /// 
    /// # Returns
    /// 
    /// * `Result<(), ChaosError>` - Success or error
    pub async fn update_pronouns(
        id: i64,
        pronouns: String,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<(), ChaosError> {
        let _ = sqlx::query!(
            "
            UPDATE users SET pronouns = $1 WHERE id = $2 RETURNING id
        ",
            pronouns,
            id
        )
        .fetch_one(transaction.deref_mut())
        .await?;

        Ok(())
    }

    /// Updates a user's gender.
    /// 
    /// # Arguments
    /// 
    /// * `id` - ID of the user to update
    /// * `gender` - New gender for the user
    /// * `pool` - Database connection pool
    /// 
    /// # Returns
    /// 
    /// * `Result<(), ChaosError>` - Success or error
    pub async fn update_gender(
        id: i64,
        gender: String,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<(), ChaosError> {
        let _ = sqlx::query!(
            "
            UPDATE users SET gender = $1 WHERE id = $2 RETURNING id
        ",
            gender,
            id
        )
        .fetch_one(transaction.deref_mut())
        .await?;

        Ok(())
    }

    /// Updates a user's zID.
    /// 
    /// # Arguments
    /// 
    /// * `id` - ID of the user to update
    /// * `zid` - New zID for the user
    /// * `pool` - Database connection pool
    /// 
    /// # Returns
    /// 
    /// * `Result<(), ChaosError>` - Success or error
    pub async fn update_zid(id: i64, zid: String, transaction: &mut Transaction<'_, Postgres>,) -> Result<(), ChaosError> {
        let _ = sqlx::query!(
            "
            UPDATE users SET zid = $1 WHERE id = $2 RETURNING id
        ",
            zid,
            id
        )
        .fetch_one(transaction.deref_mut())
        .await?;

        Ok(())
    }

    /// Updates a user's degree information.
    /// 
    /// # Arguments
    /// 
    /// * `id` - ID of the user to update
    /// * `degree_name` - New degree name for the user
    /// * `degree_starting_year` - New degree starting year for the user
    /// * `pool` - Database connection pool
    /// 
    /// # Returns
    /// 
    /// * `Result<(), ChaosError>` - Success or error
    pub async fn update_degree(
        id: i64,
        degree_name: String,
        degree_starting_year: i32,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<(), ChaosError> {
        let _ = sqlx::query!(
            "
            UPDATE users SET degree_name = $1, degree_starting_year = $2 WHERE id = $3 RETURNING id
        ",
            degree_name,
            degree_starting_year,
            id
        )
        .fetch_one(transaction.deref_mut())
        .await?;

        Ok(())
    }


    /// Creates a User, This should only used for database seeding
    pub async fn create_user(
        data: User,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<(), ChaosError> {
        sqlx::query!(
            "
            INSERT INTO users (id, email, zid, name, pronouns, gender, degree_name, degree_starting_year, role)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::user_role)
        ",
            data.id,
            data.email,
            data.zid,
            data.name,
            data.pronouns,
            data.gender,
            data.degree_name,
            data.degree_starting_year,
            data.role as UserRole
        )
        .execute(transaction.deref_mut())
        .await?;

        Ok(())
    }

}
