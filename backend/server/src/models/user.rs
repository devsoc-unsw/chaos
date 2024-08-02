use serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize, sqlx::Type, Clone)]
#[sqlx(type_name = "user_role", rename_all = "PascalCase")]
pub enum UserRole {
    User,
    SuperUser,
}

// Placeholder until User CRUD is merged
#[derive(Deserialize, Serialize)]
pub struct User {
    pub id: i64,
    pub email: String,
    pub zid: Option<String>,
    pub name: String,
    pub degree_name: Option<String>,
    pub degree_starting_year: Option<i32>,
}