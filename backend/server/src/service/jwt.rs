use axum::extract::State;
use jsonwebtoken::Algorithm;
use jsonwebtoken::{decode, Validation};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::AppState;

#[derive(Debug, Deserialize, Serialize)]
pub struct AuthorizationJwtPayload {
    pub iss: String,      // issuer
    pub sub: String,      // subject (user's id)
    pub jti: Uuid,        // id
    pub aud: Vec<String>, // audience (uri the JWT is meant for)

    // Time-based validity
    pub exp: i64, // expiry (UNIX timestamp)
    pub nbf: i64, // not-valid-before (UNIX timestamp)
    pub iat: i64, // issued-at (UNIX timestamp)

    pub username: String, // username
}

pub fn decode_auth_token(
    token: String,
    State(state): State<AppState>,
) -> Option<AuthorizationJwtPayload> {
    let decode_token = decode::<AuthorizationJwtPayload>(
        token.as_str(),
        &state.decoding_key,
        &Validation::new(Algorithm::HS256),
    );

    return match decode_token {
        Ok(token) => Option::from(token.claims),
        Err(_err) => None::<AuthorizationJwtPayload>,
    };
}
