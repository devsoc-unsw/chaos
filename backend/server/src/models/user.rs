use serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize, sqlx::Type, Clone)]
#[sqlx(type_name = "user_role", rename_all = "PascalCase")]
pub enum UserRole {
    User,
    SuperUser,
}