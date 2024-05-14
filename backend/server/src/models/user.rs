use serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize, sqlx::Type, Clone)]
#[sqlx(type_name = "UserRole", rename_all = "PascalCase")]
pub enum UserRole {
    User,
    SuperUser,
}

pub struct User {
    id: i64,
    email: String,
    zid: String,
    name: String,
    degree_name: String,
    degree_starting_year: i64,
    role: String
}
