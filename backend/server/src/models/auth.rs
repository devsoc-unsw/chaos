use axum::{
    async_trait,
    extract::FromRequest,
    http::{self, Request},
};
use serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize)]
pub struct AuthRequest {
    pub code: String,
}

#[derive(Deserialize, Serialize)]
pub struct UserProfile {
    pub email: String,
}

#[derive(Deserialize, Serialize)]
pub struct AuthUser {
    pub user_id: i64,
}

#[async_trait]
impl<S, B> FromRequest<S, B> for AuthUser
where
    B: Send + 'static,
    S: Send + Sync,
{
    type Rejection = http::StatusCode;

    async fn from_request(req: Request<B>, state: &S) -> Result<Self, Self::Rejection> {
        Ok(AuthUser { user_id: 1 })
    }
}
