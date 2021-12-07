use std::ops::Deref;
use crate::{state::ApiState, database::{guard::Connection, models::{User, NewUser}}};
use jsonwebtoken::{Header, Validation, Algorithm};
use reqwest::header;
use rocket::{request::{self, Outcome}, Request, post, State, serde::json::Json, request::FromRequest, http::Status};
use serde::{Serialize, Deserialize};
use dotenv_codegen::dotenv;
use serde_json::Value;

const GOOGLE_TOKEN_URL:   &str = "https://oauth2.googleapis.com/token";
const OPENID_EMAIL_FIELD: &str = "email";

#[derive(Debug, Serialize, Deserialize)]
pub struct AuthJwt {
    pub user_id: u32,
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

async fn get_access_token(oauth_code: &str, state: &State<ApiState>) -> Option<String> {
    #[derive(Serialize)]
    struct TokenForm<'a> {
        code: &'a str,
        client_id: &'static str,
        client_secret: &'static str,
        redirect_uri: &'static str,
        grant_type: &'static str,
    }

    #[derive(Deserialize)]
    #[allow(unused)]
    struct TokenResponse {
        access_token: String,
        expires_in: u32,
        scope: String,
        token_type: String,
        id_token: String,
    }

    let token = state.reqwest_client.post(GOOGLE_TOKEN_URL)
        .form(&TokenForm {
            code: oauth_code,
            client_id: dotenv!("GOOGLE_CLIENT_ID"),
            client_secret: dotenv!("GOOGLE_CLIENT_SECRET"),
            redirect_uri: dotenv!("GOOGLE_REDIRECT_URI"),
            grant_type: "authorization_code"
        })
        .send()
        .await
        .ok()?
        .json::<TokenResponse>()
        .await
        .ok()?
        .access_token;

    Some(token)
}

async fn get_user_email(state: &State<ApiState>, token: &str) -> Option<String> {
    let mut user_info: serde_json::Value = state.reqwest_client.get(&state.userinfo_endpoint)
        .header(header::AUTHORIZATION, format!("Bearer {}", token))
        .send()
        .await
        .ok()?
        .json::<serde_json::Value>()
        .await
        .ok()?;

    return match user_info.get_mut(OPENID_EMAIL_FIELD)?.take() {
        Value::String(user_email) => Some(user_email),
        _ => None,
    };
}

#[derive(Serialize)]
pub struct SignInResponse {
    token: String,
}

#[derive(Serialize)]
pub enum SignInError {
    InvalidOAuthCode,
    GoogleOAuthInternalError,
    SignupRequired,
}

#[post("/signin/<oauth_code>")]
pub async fn signin(oauth_code: String, state: &State<ApiState>, conn: Connection) -> Result<Json<SignInResponse>, Json<SignInError>> {
    let token = get_access_token(&oauth_code, state)
        .await
        .ok_or(Json(SignInError::InvalidOAuthCode))?;
    
    let email = get_user_email(state, &token)
        .await
        .ok_or(Json(SignInError::GoogleOAuthInternalError))?;

    let user = User::get_from_email(conn.deref(), &email)
        .ok_or(Json(SignInError::GoogleOAuthInternalError))?;

    let auth = AuthJwt {
        user_id: user.id as u32,
    };

    let token = jsonwebtoken::encode(&Header::new(jsonwebtoken::Algorithm::HS256), &auth, &state.jwt_encoding_key)
        .expect("creating jwt should never fail");

    return Ok(Json(SignInResponse {
        token,
    }));
}

#[derive(Deserialize)]
pub struct SignUpBody {
    zid: String,
    display_name: String,
    degree_name: String,
    degree_starting_year: u32,
}

#[derive(Serialize)]
pub struct SignUpResponse {
    token: String,
}

#[derive(Serialize)]
pub enum SignUpError {
    InvalidOAuthCode,
    GoogleOAuthInternalError,
    AccountAlreadyExists,
}

#[post("/signup?<code>", data = "<body>")]
pub async fn signup(state: &State<ApiState>, conn: Connection, code: String, body: Json<SignUpBody>) -> Result<Json<SignUpResponse>, Json<SignUpError>> {
    let token = get_access_token(&code, state)
        .await
        .ok_or(Json(SignUpError::InvalidOAuthCode))?;

    let email = get_user_email(state, &token)
        .await
        .ok_or(Json(SignUpError::GoogleOAuthInternalError))?;

    if User::get_from_email(conn.deref(), &email).is_some() {
        return Err(Json(SignUpError::AccountAlreadyExists));
    }

    let user = NewUser {
        email,
        google_token: token,
        zid: body.zid.to_string(),
        display_name: body.display_name.to_string(),
        degree_name: body.degree_name.to_string(),
        degree_starting_year: body.degree_starting_year as i32,
        superuser: false,
    }.insert(conn.deref())
        .expect("we already ensured a conflicting user does not exist");

    let auth = AuthJwt {
        user_id: user.id as u32,
    };

    let token = jsonwebtoken::encode(&Header::new(jsonwebtoken::Algorithm::HS256), &auth, &state.jwt_encoding_key)
        .expect("creating jwt should never fail");

    return Ok(Json(SignUpResponse {
        token,
    }));
}
