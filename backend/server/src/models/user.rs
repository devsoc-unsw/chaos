use serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize, sqlx::Type, Clone)]
#[sqlx(type_name = "UserRole", rename_all = "PascalCase")]
pub enum UserRole {
    User,
    SuperUser,
}