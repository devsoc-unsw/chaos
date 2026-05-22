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



#[cfg(test)]
mod tests {
    // =========================================================================
    // TEST PLAN – Equivalence Partitioning (EP) & Boundary Value Analysis (BVA)
    // =========================================================================
    //
    // Functions under test
    //   · encode_auth_token(username, user_id, encoding_key, jwt_header) -> String
    //   · decode_auth_token(token, decoding_key, jwt_validator) -> Option<AuthorizationJwtPayload>
    //
    // ── EQUIVALENCE PARTITIONING ──────────────────────────────────────────────
    //
    // encode_auth_token – inputs
    //
    //  ID    Input     Class                  Expected         Test
    //  EP01  username  non-empty string       token produced   payload_fields_match_internal_constants
    //  EP02  username  empty string ("")      token produced   encodes_empty_username
    //  EP03  user_id   positive i64           stored verbatim  payload_fields_match_internal_constants
    //  EP04  user_id   zero (0)               stored verbatim  encodes_empty_username
    //  EP05  user_id   negative i64           stored verbatim  encodes_negative_user_id
    //
    // decode_auth_token – token input
    //
    //  ID    Token state                    Expected    Test
    //  EP06  valid, unexpired, correct sig  Some(...)   payload_fields_match_internal_constants
    //  EP07  expired (exp < now)            None        returns_none_for_expired_token
    //  EP08  signed with wrong key          None        returns_none_for_wrong_secret
    //  EP09  header segment altered         None        returns_none_for_tampered_header
    //  EP10  payload segment altered        None        returns_none_for_tampered_payload
    //  EP11  signature segment altered      None        returns_none_for_tampered_signature
    //  EP12  not a JWT (arbitrary string)   None        returns_none_for_invalid_token_string
    //  EP13  empty string ("")              None        returns_none_for_invalid_token_string
    //
    // decode_auth_token – validator input
    //
    //  ID    Validator state                Expected    Test
    //  EP14  correct audience               Some(...)   payload_fields_match_internal_constants
    //  EP15  wrong audience                 None        returns_none_for_wrong_audience
    //  EP16  wrong algorithm (HS384)        None        returns_none_for_wrong_algorithm
    //
    // ── BOUNDARY VALUE ANALYSIS ───────────────────────────────────────────────
    //
    // user_id (type: i64)
    // Partition boundary: valid = any i64; no rejection inside encode_auth_token.
    //
    //  ID    Value      Expected         Test                                    Status
    //  BV01  i64::MIN   stored verbatim  –                                       not covered
    //  BV02  -1         stored verbatim  encodes_negative_user_id                ✓
    //  BV03   0         stored verbatim  encodes_empty_username                  ✓
    //  BV04   1         stored verbatim  payload_fields_match_internal_constants ✓
    //  BV05  i64::MAX   stored verbatim  –                                       not covered
    //
    // token expiry – boundary around now (default_validation leeway = 60 s)
    // Valid window: exp > (now − leeway).  Partition boundary is at now − 60 s.
    //
    //  ID    exp value               Side of boundary      Expected  Test                               Status
    //  BV06  now + 604800 (7 days)   well inside valid     Some      timestamps_reflect_seven_day_expiry ✓
    //  BV07  now + 1                 just inside valid     Some      –                                   not covered
    //  BV08  now − 59               inside leeway         Some      –                                   not covered
    //  BV09  now − 61               just past leeway      None      returns_none_for_expired_token      ✓
    //  BV10  now − 3600             well past expiry      None      returns_none_for_expired_token      ✓
    //
    // ── KNOWN GAPS ────────────────────────────────────────────────────────────
    //
    //  · BV01 / BV05 — extreme user_id values (i64::MIN, i64::MAX) are not tested.
    //    JSON represents numbers as floating-point internally, and some parsers
    //    silently lose precision beyond ±2^53. No test currently verifies that
    //    the decoded sub claim survives a round-trip at the i64 extremes.
    //
    //  · BV07 / BV08 — the exact leeway boundary is not tested.
    //    default_validation() applies a 60-second grace period to expiry checks,
    //    so a token expired 59 seconds ago is still valid and one expired 61 seconds
    //    ago is not. No test sits at either side of that boundary, so a leeway
    //    misconfiguration would go undetected.
    //
    //  · "alg:none" attack — no test explicitly rejects an unsigned token.
    //    An attacker can forge a JWT by setting the algorithm to "none" and omitting
    //    the signature, allowing arbitrary claims. The jsonwebtoken crate blocks
    //    this by default, but without a test asserting the rejection, that
    //    protection is invisible and could be silently removed by a config change.
    //
    //  · nbf (not-before) claim is stored in every token but never enforced.
    //    Validation::new() sets validate_nbf = false, so a token with nbf set to
    //    tomorrow would be accepted today. This has no impact while encode_auth_token
    //    always sets nbf to the current time, but if that ever changes the decoder
    //    would silently accept tokens before they are meant to be valid. Fix by
    //    setting v.validate_nbf = true in default_validation() and adding a test.
    // =========================================================================

    use super::*;
    use jsonwebtoken::{Algorithm, DecodingKey, EncodingKey, Header, Validation};
    use std::time::{Duration, SystemTime, UNIX_EPOCH};

    // ── helpers ──────────────────────────────────────────────────────────────

    fn test_keys() -> (EncodingKey, DecodingKey) {
        let secret = b"test-secret";
        (
            EncodingKey::from_secret(secret),
            DecodingKey::from_secret(secret),
        )
    }

    fn default_validation() -> Validation {
        let mut v = Validation::new(Algorithm::HS256);
        v.set_audience(&["chaos.devsoc.app"]);
        v
    }

    fn now_secs() -> i64 {
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs() as i64
    }

    // ── AuthorizationJwtPayload field coverage ────────────────────────────────

    /// White-box: verifies every field in AuthorizationJwtPayload is set
    /// correctly by encode_auth_token, including hardcoded internals.
    #[test]
    fn payload_fields_match_internal_constants() {
        let (enc, dec) = test_keys();
        let token = encode_auth_token("bob".to_string(), 99, &enc, &Header::default());
        let payload = decode_auth_token(&token, &dec, &default_validation()).unwrap();

        // hardcoded issuer string inside encode_auth_token
        assert_eq!(payload.iss, "Chaos");
        // hardcoded audience string inside encode_auth_token
        assert_eq!(payload.aud, vec!["chaos.devsoc.app"]);
        assert_eq!(payload.sub, 99);
        assert_eq!(payload.username, "bob");
        // jti must be a valid (non-nil) UUID
        assert_ne!(payload.jti, uuid::Uuid::nil());
    }

    /// White-box: iat and nbf are both set to current_time; exp = iat + 604800.
    #[test]
    fn timestamps_reflect_seven_day_expiry() {
        let before = now_secs();
        let (enc, dec) = test_keys();
        let token = encode_auth_token("carol".to_string(), 1, &enc, &Header::default());
        let after = now_secs();

        let payload = decode_auth_token(&token, &dec, &default_validation()).unwrap();

        assert!(
            payload.iat >= before && payload.iat <= after,
            "iat should be current time"
        );
        assert_eq!(
            payload.nbf, payload.iat,
            "nbf and iat must be identical (set from the same current_time)"
        );
        assert_eq!(
            payload.exp,
            payload.iat + 604800,
            "exp must be exactly 7 days (604800 s) ahead of iat"
        );
    }

    /// White-box: every call must produce a distinct jti (Uuid::new_v4).
    #[test]
    fn each_token_gets_unique_jti() {
        let (enc, dec) = test_keys();
        let v = default_validation();
        let t1 = encode_auth_token("dave".to_string(), 1, &enc, &Header::default());
        let t2 = encode_auth_token("dave".to_string(), 1, &enc, &Header::default());

        let p1 = decode_auth_token(&t1, &dec, &v).unwrap();
        let p2 = decode_auth_token(&t2, &dec, &v).unwrap();

        assert_ne!(p1.jti, p2.jti, "each token must have a unique jti");
    }

    // ── encode_auth_token ─────────────────────────────────────────────────────

    /// White-box: negative user IDs are stored correctly (i64 range).
    #[test]
    fn encodes_negative_user_id() {
        let (enc, dec) = test_keys();
        let token = encode_auth_token("neg".to_string(), -1, &enc, &Header::default());
        let payload = decode_auth_token(&token, &dec, &default_validation()).unwrap();
        assert_eq!(payload.sub, -1);
    }

    /// White-box: an empty username string is accepted (no validation inside encode).
    #[test]
    fn encodes_empty_username() {
        let (enc, dec) = test_keys();
        let token = encode_auth_token("".to_string(), 0, &enc, &Header::default());
        let payload = decode_auth_token(&token, &dec, &default_validation()).unwrap();
        assert_eq!(payload.username, "");
    }

    // ── decode_auth_token ─────────────────────────────────────────────────────

    /// White-box: a token signed with a different secret must return None.
    #[test]
    fn returns_none_for_wrong_secret() {
        let (enc, _) = test_keys();
        let (_, wrong_dec) = (
            EncodingKey::from_secret(b"other"),
            DecodingKey::from_secret(b"other"),
        );
        let token = encode_auth_token("eve".to_string(), 7, &enc, &Header::default());
        assert!(decode_auth_token(&token, &wrong_dec, &default_validation()).is_none());
    }

    /// White-box: appending a character to the token breaks the signature check.
    #[test]
    fn returns_none_for_tampered_signature() {
        let (enc, dec) = test_keys();
        let token = encode_auth_token("frank".to_string(), 8, &enc, &Header::default());
        let tampered = format!("{}x", token);
        assert!(decode_auth_token(&tampered, &dec, &default_validation()).is_none());
    }

    /// White-box: audience mismatch results in None (jsonwebtoken validates aud claim).
    #[test]
    fn returns_none_for_wrong_audience() {
        let (enc, dec) = test_keys();
        let token = encode_auth_token("grace".to_string(), 9, &enc, &Header::default());
        let mut bad_aud = Validation::new(Algorithm::HS256);
        bad_aud.set_audience(&["wrong-audience"]);
        assert!(decode_auth_token(&token, &dec, &bad_aud).is_none());
    }

    /// White-box: a completely invalid string (not Base64-URL JWT) returns None.
    #[test]
    fn returns_none_for_invalid_token_string() {
        let (_, dec) = test_keys();
        assert!(decode_auth_token("not.a.jwt", &dec, &default_validation()).is_none());
        assert!(decode_auth_token("", &dec, &default_validation()).is_none());
    }

    /// White-box: altering the header segment (first part) invalidates the token.
    #[test]
    fn returns_none_for_tampered_header() {
        let (enc, dec) = test_keys();
        let token = encode_auth_token("ivan".to_string(), 10, &enc, &Header::default());
        let parts: Vec<&str> = token.splitn(3, '.').collect();
        // replace header with a dummy base64url value
        let tampered = format!("dGVzdA.{}.{}", parts[1], parts[2]);
        assert!(decode_auth_token(&tampered, &dec, &default_validation()).is_none());
    }

    /// White-box: altering the payload segment invalidates the signature.
    #[test]
    fn returns_none_for_tampered_payload() {
        let (enc, dec) = test_keys();
        let token = encode_auth_token("judy".to_string(), 11, &enc, &Header::default());
        let parts: Vec<&str> = token.splitn(3, '.').collect();
        let tampered = format!("{}.dGVzdA.{}", parts[0], parts[2]);
        assert!(decode_auth_token(&tampered, &dec, &default_validation()).is_none());
    }

    /// White-box: a token with an `exp` in the past must be rejected.
    #[test]
    fn returns_none_for_expired_token() {
        let (enc, dec) = test_keys();
        // 1 hour ago — well past the default 60 s leeway in Validation::new()
        let past = now_secs() - 3600;
        let claims = AuthorizationJwtPayload {
            iss: "Chaos".to_string(),
            sub: 1,
            jti: Uuid::new_v4(),
            aud: vec!["chaos.devsoc.app".to_string()],
            exp: past,
            nbf: past - 10,
            iat: past - 10,
            username: "expired".to_string(),
        };
        let token = encode(&Header::default(), &claims, &enc).unwrap();
        assert!(decode_auth_token(&token, &dec, &default_validation()).is_none());
    }

    /// White-box: a token signed with HS256 must be rejected when validated against HS384.
    #[test]
    fn returns_none_for_wrong_algorithm() {
        let (enc, dec) = test_keys();
        let token = encode_auth_token("mallory".to_string(), 12, &enc, &Header::default());
        let mut wrong_alg = Validation::new(Algorithm::HS384);
        wrong_alg.set_audience(&["chaos.devsoc.app"]);
        assert!(decode_auth_token(&token, &dec, &wrong_alg).is_none());
    }
}