use serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize)]
pub struct AuthRequest {
    pub code: String
}

#[derive(Deserialize, Serialize)]
pub struct UserProfile {
    pub email: String
}