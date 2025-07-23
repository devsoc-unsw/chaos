//! JWT service for the Chaos application.
//! 
//! This module provides functionality for JWT token management, including:
//! - Token encoding and decoding
//! - Token payload structure
//! - Token validation

use jsonwebtoken::DecodingKey;
use jsonwebtoken::{decode, encode, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use uuid::Uuid;

/// Represents the payload structure of an authorization JWT token.
/// 
/// This struct contains all the claims that are encoded in the JWT token,
/// including user information and token validity timestamps.
/// 
/// # Fields
/// 
/// * `iss` - The issuer of the token (Chaos)
/// * `sub` - The subject of the token (user's ID)
/// * `jti` - A unique identifier for the token
/// * `aud` - The intended audience for the token
/// * `exp` - Token expiration timestamp
/// * `nbf` - Token not-valid-before timestamp
/// * `iat` - Token issued-at timestamp
/// * `username` - The username associated with the token
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

/// Encodes a new authorization JWT token.
/// 
/// This function creates a new JWT token with the provided user information
/// and signs it using the provided encoding key. The token is valid for 7 days
/// from the time of creation.
/// 
/// # Arguments
/// 
/// * `username` - The username to include in the token
/// * `user_id` - The user ID to include in the token
/// * `encoding_key` - The key used to sign the token
/// * `jwt_header` - The header to use for the token
/// 
/// # Returns
/// 
/// * `String` - The encoded JWT token
/// 
/// # Panics
/// 
/// This function will panic if:
/// * The system time cannot be retrieved
/// * The token cannot be encoded
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
        username,
    };

    encode(jwt_header, &claims, encoding_key).unwrap()
}

/// Decodes and validates an authorization JWT token.
/// 
/// This function attempts to decode and validate a JWT token using the provided
/// decoding key and validation parameters.
/// 
/// # Arguments
/// 
/// * `token` - The JWT token to decode
/// * `decoding_key` - The key used to verify the token's signature
/// * `jwt_validator` - The validation parameters to use
/// 
/// # Returns
/// 
/// * `Option<AuthorizationJwtPayload>` - The decoded token payload if valid, None otherwise
pub fn decode_auth_token(
    token: &str,
    decoding_key: &DecodingKey,
    jwt_validator: &Validation,
) -> Option<AuthorizationJwtPayload> {
    let decode_token = decode::<AuthorizationJwtPayload>(token, decoding_key, jwt_validator);

    match decode_token {
        Ok(token) => Option::from(token.claims),
        Err(_err) => None::<AuthorizationJwtPayload>,
    }
}
