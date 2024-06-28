use serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize, sqlx::Type, Clone)]
#[sqlx(type_name = "UserRole", rename_all = "PascalCase")]
pub enum UserRole {
    User,
    SuperUser,
}

pub struct User {
    pub id: i64,
    pub email: String,
    pub zid: String,
    pub name: String,
    pub degree_name: String,
    pub degree_starting_year: i64,
    pub role: String
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
