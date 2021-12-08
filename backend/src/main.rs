#[macro_use] extern crate diesel;

pub mod auth;
pub mod database;
pub mod cors;
pub mod state;

use auth::Auth;
use database::pool;
use cors::cors;
use rocket::routes;

#[rocket::get("/foo")]
fn authed_call(auth: Auth) -> String {
    format!("hello, your user id is {}", auth.jwt.user_id)
}

#[rocket::main]
async fn main() {
    let api_state = state::api_state().await;
    let connection_pool = pool();

    let cors = cors(); 

    rocket::build()
        .manage(api_state)
        .manage(connection_pool)
        .attach(cors)
        .mount("/", routes![authed_call])
        .mount("/auth", routes![auth::signin, auth::signup])
        .launch()
        .await
        .unwrap();
}
