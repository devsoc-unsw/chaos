use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Deserialize, Serialize, sqlx::Type, Clone)]
#[sqlx(type_name = "user_role", rename_all = "PascalCase")]
pub enum UserRole {
    User,
    SuperUser,
}

#[derive(Deserialize, Serialize, FromRow)]
pub struct User {
    pub id: i64,
    pub email: String,
    pub zid: Option<String>,
    pub name: String,
    pub degree_name: Option<String>,
    pub degree_starting_year: Option<i32>,
    pub role: UserRole
}

pub struct UserName {
    pub name: String
}

pub struct UserZid {
    pub zid: String
}

pub struct UserDegree {
    pub degree_name: String,
    pub degree_starting_year: i64
}
