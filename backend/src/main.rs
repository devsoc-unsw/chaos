#[macro_use] extern crate diesel;

pub mod auth;
pub mod database;
pub mod cors;
pub mod state;
pub mod guard;
pub mod organisation;

use auth::Auth;
use cors::cors;
use database::Database;
use rocket::routes;

#[rocket::get("/foo")]
fn authed_call(auth: Auth) -> String {
    format!("hello, your user id is {}", auth.jwt.user_id)
}

#[rocket::main]
async fn main() {
    dotenv::dotenv().unwrap();

    let api_state = state::api_state().await;

    let cors = cors(); 

    rocket::build()
        .manage(api_state)
        .attach(Database::fairing())
        .attach(cors)
        .mount("/", routes![authed_call])
        .mount("/organisation", routes![organisation::new])
        .mount("/auth", routes![auth::signin, auth::signup])
        .launch()
        .await
        .unwrap();
}
