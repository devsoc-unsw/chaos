use std::time::{Duration, SystemTime, UNIX_EPOCH};
use axum::extract::State;
use jsonwebtoken::{decode, encode, EncodingKey, Header, Validation};
use jsonwebtoken::{Algorithm, DecodingKey};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::AppState;

#[derive(Debug, Deserialize, Serialize)]
pub struct AuthorizationJwtPayload {
    pub iss: String,      // issuer
    pub sub: i64,         // subject (user's id)
    pub jti: Uuid,        // id
    pub aud: Vec<String>, // audience (uri the JWT is meant for)

    // Time-based validity
    pub exp: i64, // expiry (UNIX timestamp)
    pub nbf: i64, // not-valid-before (UNIX timestamp)
    pub iat: i64, // issued-at (UNIX timestamp)

    pub username: String, // username
}

pub fn encode_auth_token(
    username: String,
    user_id: i64,
    encoding_key: &EncodingKey,
    jwt_header: &Header,
) -> String {
    let current_time = SystemTime::now().duration_since(UNIX_EPOCH).unwrap();
    let expiry = i64::try_from((current_time + Duration::from_secs(604800)).as_secs()).unwrap();
    let claims = AuthorizationJwtPayload {
        iss: "Chaos".to_string(),
        sub: user_id,
        jti: Uuid::new_v4(),
        aud: vec!["chaos.devsoc.app".to_string()],
        exp: expiry,
        nbf: i64::try_from(current_time.as_secs()).unwrap(),
        iat: i64::try_from(current_time.as_secs()).unwrap(),
        username
    };

    encode(jwt_header, &claims, encoding_key).unwrap()
}

pub fn decode_auth_token(
    token: &str,
    decoding_key: &DecodingKey,
    jwt_validator: &Validation,
) -> Option<AuthorizationJwtPayload> {
    let decode_token = decode::<AuthorizationJwtPayload>(
        token,
        decoding_key,
        jwt_validator,
    );

    match decode_token {
        Ok(token) => Option::from(token.claims),
        Err(_err) => None::<AuthorizationJwtPayload>,
    }
}
