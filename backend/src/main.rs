#[macro_use]
extern crate diesel;

pub mod application;
pub mod auth;
pub mod campaigns;
pub mod cors;
pub mod database;
pub mod guard;
pub mod organisation;
pub mod state;
pub mod user;

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
        .mount(
            "/organisation",
            routes![
                organisation::new,
                organisation::get_from_id,
                organisation::delete,
                organisation::get_admins,
                organisation::set_admins,
            ],
        )
        .mount("/auth", routes![auth::signin, auth::signup])
        .mount(
            "/campaign",
            routes![
                campaigns::get,
                campaigns::update,
                campaigns::roles,
                campaigns::create,
                campaigns::delete_campaign,
                campaigns::get_all_campaigns,
            ],
        )
        .mount("/user", routes![user::get_user, user::get_user_campaigns])
        .mount("/application", routes![application::create_comment])
        .launch()
        .await
        .unwrap();
}
