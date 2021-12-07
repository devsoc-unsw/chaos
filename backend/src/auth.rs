use crate::ApiState;
use jsonwebtoken::{Header, Validation, Algorithm};
use rocket::{request::{self, Outcome}, Request, post, State, serde::json::Json, request::FromRequest, http::Status};
use serde::{Serialize, Deserialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct AuthJwt {
    pub token: String,
}

pub struct Auth {
    pub jwt: AuthJwt,
}

#[derive(Debug)]
pub enum AuthError {
    MissingAuthorizationHeader,
    MissingBearer,
    InvalidJwt,
    ApiStateMissing,
}

#[rocket::async_trait]
impl<'r> FromRequest<'r> for Auth {
    type Error = AuthError;

    async fn from_request(request: &'r Request<'_>) -> request::Outcome<Self, Self::Error> {
        let api_state = match request.guard::<&State<ApiState>>().await {
            Outcome::Success(api_state) => api_state,
            _ => return Outcome::Failure((Status::InternalServerError, AuthError::ApiStateMissing))
        };

        let header = match request.headers().get_one("Authorization") {
            Some(header) => header,
            None => return Outcome::Failure((Status::BadRequest, AuthError::MissingAuthorizationHeader)),
        };

        if !header.starts_with("Bearer ") {
            return Outcome::Failure((Status::BadRequest, AuthError::MissingBearer));
        }

        let token = header.trim_start_matches("Bearer ");
        
        let validation = Validation {
            algorithms: vec![Algorithm::HS256],
            validate_exp: false,
            ..Default::default()
        };

        let token = match jsonwebtoken::decode::<AuthJwt>(token, &api_state.jwt_decoding_key, &validation) {
            Ok(data) => data.claims,
            Err(_) => return Outcome::Failure((Status::BadRequest, AuthError::InvalidJwt)),
        };

        return Outcome::Success(Auth {
            jwt: token
        });
    }
}

#[derive(Serialize)]
pub struct AuthWithCodeResponse {
    token: String,
}

#[post("/login/<oauth_code>")]
pub fn auth_with_code(state: &State<ApiState>, oauth_code: String) -> Json<AuthWithCodeResponse> {
    let auth = AuthJwt {
        token: oauth_code,
    };

    let token = jsonwebtoken::encode(&Header::new(jsonwebtoken::Algorithm::HS256), &auth, &state.jwt_encoding_key)
        .expect("creating jwt should never fail");

    return Json(AuthWithCodeResponse {
        token,
    });
}
