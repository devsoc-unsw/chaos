#[macro_use] extern crate diesel;

use auth::Auth;
use jsonwebtoken::{EncodingKey, DecodingKey};
use rocket::routes;
use dotenv_codegen::dotenv;

pub mod auth;
pub mod schema;

pub struct ApiState {
    jwt_encoding_key: EncodingKey,
    jwt_decoding_key: DecodingKey<'static>,
}

#[rocket::get("/foo")]
fn authed_call(auth: Auth) -> String {
    format!("hello, your token is {}", auth.jwt.token)
}

#[rocket::main]
async fn main() {
    let jwt_secret = dotenv!("JWT_SECRET");

    let api_state = ApiState {
        jwt_encoding_key: EncodingKey::from_secret(jwt_secret.as_bytes()),
        jwt_decoding_key: DecodingKey::from_secret(jwt_secret.as_bytes()),
    };

    rocket::build()
        .manage(api_state)
        .mount("/", routes![authed_call])
        .mount("/auth", routes![auth::auth_with_code])
        .launch()
        .await
        .unwrap();
}
