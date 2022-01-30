use crate::{
    database::{
        models::{NewUser, User},
        Database,
    },
    state::ApiState,
};
use dotenv_codegen::dotenv;
use jsonwebtoken::{Algorithm, Header, Validation};
use reqwest::header;
use rocket::{
    http::Status,
    post,
    request::FromRequest,
    request::{self, Outcome},
    serde::json::Json,
    Request, State,
};
use serde::{Deserialize, Serialize};
use serde_json::Value;

const GOOGLE_TOKEN_URL: &str = "https://oauth2.googleapis.com/token";
const OPENID_EMAIL_FIELD: &str = "email";
const OPENID_NAME_FIELD: &str = "name";

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
    NotSuperUser,
}

#[rocket::async_trait]
impl<'r> FromRequest<'r> for Auth {
    type Error = AuthError;

    async fn from_request(request: &'r Request<'_>) -> request::Outcome<Self, Self::Error> {
        let api_state = match request.guard::<&State<ApiState>>().await {
            Outcome::Success(api_state) => api_state,
            _ => {
                return Outcome::Failure((Status::InternalServerError, AuthError::ApiStateMissing))
            }
        };

        let header = match request.headers().get_one("Authorization") {
            Some(header) => header,
            None => {
                return Outcome::Failure((
                    Status::BadRequest,
                    AuthError::MissingAuthorizationHeader,
                ))
            }
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

        let token = match jsonwebtoken::decode::<AuthJwt>(
            token,
            &api_state.jwt_decoding_key,
            &validation,
        ) {
            Ok(data) => data.claims,
            Err(_) => return Outcome::Failure((Status::BadRequest, AuthError::InvalidJwt)),
        };

        return Outcome::Success(Auth { jwt: token });
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

    let token = state
        .reqwest_client
        .post(GOOGLE_TOKEN_URL)
        .form(&TokenForm {
            code: oauth_code,
            client_id: dotenv!("GOOGLE_CLIENT_ID"),
            client_secret: dotenv!("GOOGLE_CLIENT_SECRET"),
            redirect_uri: dotenv!("GOOGLE_REDIRECT_URI"),
            grant_type: "authorization_code",
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

struct UserDetails {
    email: Option<String>,
    name: Option<String>,
}

async fn get_user_details(state: &State<ApiState>, token: &str) -> UserDetails {
    let response = match state
        .reqwest_client
        .get(&state.userinfo_endpoint)
        .header(header::AUTHORIZATION, format!("Bearer {}", token))
        .send()
        .await
    {
        Ok(response) => response,
        Err(_) => {
            return UserDetails {
                email: None,
                name: None,
            }
        }
    };

    let mut user_info = match response.json::<serde_json::Value>().await {
        Ok(user_info) => user_info,
        Err(_) => {
            return UserDetails {
                email: None,
                name: None,
            }
        }
    };

    let email = match user_info.get_mut(OPENID_EMAIL_FIELD) {
        Some(Value::String(email)) => Some(email.to_string()),
        _ => None,
    };

    let name = match user_info.get_mut(OPENID_NAME_FIELD) {
        Some(Value::String(name)) => Some(name.to_string()),
        _ => None,
    };

    UserDetails { email, name }
}

#[derive(Deserialize)]
pub struct SignInBody {
    oauth_token: String,
}

#[derive(Serialize)]
pub struct SignInResponse {
    token: String,
}

#[derive(Serialize)]
pub enum SignInError {
    InvalidOAuthCode,
    GoogleOAuthInternalError,
    SignupRequired {
        signup_token: String,
        name: Option<String>,
    },
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SignupJwt {
    pub auth_token: String,
}

#[post("/signin", data = "<body>")]
pub async fn signin(
    body: Json<SignInBody>,
    state: &State<ApiState>,
    db: Database,
) -> Result<Json<SignInResponse>, Json<SignInError>> {
    let token = get_access_token(&body.oauth_token, state)
        .await
        .ok_or(Json(SignInError::InvalidOAuthCode))?;

    let details = get_user_details(state, &token).await;

    let email = details
        .email
        .ok_or(Json(SignInError::GoogleOAuthInternalError))?;

    let user = db
        .run(move |conn| User::get_from_email(conn, &email))
        .await
        .ok_or_else(|| {
            let jwt = SignupJwt { auth_token: token };

            let token = jsonwebtoken::encode(
                &Header::new(jsonwebtoken::Algorithm::HS256),
                &jwt,
                &state.jwt_encoding_key,
            )
            .expect("creating jwt should never fail");

            Json(SignInError::SignupRequired {
                signup_token: token,
                name: details.name,
            })
        })?;

    let auth = AuthJwt {
        user_id: user.id as u32,
    };

    let token = jsonwebtoken::encode(
        &Header::new(jsonwebtoken::Algorithm::HS256),
        &auth,
        &state.jwt_encoding_key,
    )
    .expect("creating jwt should never fail");

    Ok(Json(SignInResponse { token }))
}

#[derive(Deserialize, Clone)]
pub struct SignUpBody {
    signup_token: String,
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
    InvalidSignupToken,
    GoogleOAuthInternalError,
    AccountAlreadyExists,
}

#[post("/signup", data = "<body>")]
pub async fn signup(
    body: Json<SignUpBody>,
    state: &State<ApiState>,
    db: Database,
) -> Result<Json<SignUpResponse>, Json<SignUpError>> {
    let validation = Validation {
        algorithms: vec![Algorithm::HS256],
        validate_exp: false,
        ..Default::default()
    };

    let token = match jsonwebtoken::decode::<SignupJwt>(
        &body.signup_token,
        &state.jwt_decoding_key,
        &validation,
    ) {
        Ok(data) => data.claims.auth_token,
        Err(_) => return Err(Json(SignUpError::InvalidSignupToken)),
    };

    let details = get_user_details(state, &token).await;

    let email = details
        .email
        .ok_or(Json(SignUpError::GoogleOAuthInternalError))?;

    {
        let email = email.clone();

        if db
            .run(move |conn| User::get_from_email(conn, &email))
            .await
            .is_some()
        {
            return Err(Json(SignUpError::AccountAlreadyExists));
        }
    }

    let user = {
        let email = email.clone();
        let body = body.clone();

        db.run(move |conn| {
            let user = NewUser {
                email,
                zid: body.zid.to_string(),
                display_name: body.display_name.to_string(),
                degree_name: body.degree_name.to_string(),
                degree_starting_year: body.degree_starting_year as i32,
                superuser: false,
            };

            user.insert(conn)
                .expect("we already ensured a conflicting user does not exist")
        })
        .await
    };

    let auth = AuthJwt {
        user_id: user.id as u32,
    };

    let token = jsonwebtoken::encode(
        &Header::new(jsonwebtoken::Algorithm::HS256),
        &auth,
        &state.jwt_encoding_key,
    )
    .expect("creating jwt should never fail");

    Ok(Json(SignUpResponse { token }))
}
