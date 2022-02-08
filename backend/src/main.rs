#[macro_use]
extern crate diesel;

pub mod application;
pub mod auth;
pub mod campaigns;
pub mod comment;
pub mod cors;
pub mod database;
pub mod guard;
pub mod organisation;
pub mod permissions;
pub mod role;
pub mod seed;
pub mod state;
pub mod user;

use auth::Auth;
use cors::cors;
use database::Database;
use rocket::routes;
use std::env;

#[rocket::get("/foo")]
fn authed_call(auth: Auth) -> String {
    format!("hello, your user id is {}", auth.jwt.user_id)
}

#[rocket::main]
async fn main() {
    dotenv::dotenv().unwrap();
    if let Ok(_) = env::var("SEED") {
        seed::seed();
    }

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
        .mount("/application", routes![application::create_application])
        .mount(
            "/question",
            routes![
                question::get_question,
                question::edit_question,
                question::delete_question
            ],
        )
        .mount(
            "/role",
            routes![role::get_role, role::update_role, role::new_role],
        )
        .mount(
            "/comment",
            routes![comment::create_comment, comment::get_comment_from_id],
        )
        .launch()
        .await
        .unwrap();
}
