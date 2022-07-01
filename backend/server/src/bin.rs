extern crate diesel;

#[macro_use]
extern crate diesel_migrations;

use backend::auth::Auth;
use backend::cors::cors;
use backend::database::Database;
use diesel::pg::PgConnection;
use diesel::prelude::*;
use diesel_migrations::*;
use figment::{providers::Serialized, Figment};
use rocket::{routes, serde::json::Value};
use std::env;

#[rocket::get("/foo")]
fn authed_call(auth: Auth) -> String {
    format!("hello, your user id is {}", auth.jwt.user_id)
}

embed_migrations!();

#[rocket::main]
async fn main() {
    dotenv::dotenv().ok();

    let db_url = run_migrations();

    let api_state = backend::state::api_state().await;

    let cors = cors();

    let config_map: Value = serde_json::from_str(&format!(
        r#"{{
            "databases": {{
                "database": {{
                    "url": "{}"
                }}
            }},
            "log_level": "debug",
            "address": "0.0.0.0"
        }}"#,
        db_url
    ))
    .unwrap();

    let figment = Figment::from(rocket::Config::default()).merge(Serialized::globals(config_map));

    rocket::custom(figment)
        .manage(api_state)
        .attach(Database::fairing())
        .attach(cors)
        .mount("/", routes![authed_call])
        .mount(
            "/organisation",
            routes![
                backend::organisation::new,
                backend::organisation::get_from_id,
                backend::organisation::delete,
                backend::organisation::get_admins,
                backend::organisation::set_admins,
                backend::organisation::is_admin,
                backend::organisation::get_from_ids,
                backend::organisation::invite_uid,
                backend::organisation::invite_email,
            ],
        )
        .mount(
            "/auth",
            routes![backend::auth::signin, backend::auth::signup],
        )
        .mount(
            "/campaign",
            routes![
                backend::campaigns::get,
                backend::campaigns::update,
                backend::campaigns::roles,
                backend::campaigns::create,
                backend::campaigns::new,
                backend::campaigns::delete_campaign,
                backend::campaigns::get_all_campaigns,
            ],
        )
        .mount(
            "/user",
            routes![
                backend::user::get_user,
                backend::user::get_user_campaigns,
                backend::user::get,
            ],
        )
        .mount(
            "/application",
            routes![
                backend::application::create_application,
                backend::application::create_rating,
                backend::application::submit_answer,
                backend::application::get_answers,
                backend::application::get_ratings,
                backend::application::set_status,
            ],
        )
        .mount(
            "/role",
            routes![
                backend::role::get_role,
                backend::role::update_role,
                backend::role::new_role,
                backend::role::get_questions,
                backend::role::get_applications,
            ],
        )
        .mount(
            "/comment",
            routes![
                backend::comment::create_comment,
                backend::comment::get_comment_from_id
            ],
        )
        .mount(
            "/question",
            routes![
                backend::question::get_question,
                backend::question::edit_question,
                backend::question::delete_question
            ],
        )
        .mount("/admin", routes![backend::admin::get,])
        .launch()
        .await
        .unwrap();
}

fn run_migrations() -> String {
    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");

    assert!(&database_url[database_url.len() - 5..] == "chaos");

    let database_url_no_chaos = String::from(&database_url[..database_url.len() - 5]);

    let main_connection = PgConnection::establish(&database_url_no_chaos)
        .expect(&format!("Error connecting to {}", database_url_no_chaos));

    match diesel::sql_query("CREATE DATABASE chaos").execute(&main_connection) {
        _ => (),
    };

    let chaos_connection = PgConnection::establish(&database_url)
        .expect(&format!("Error connecting to {}", database_url));

    embedded_migrations::run_with_output(&chaos_connection, &mut std::io::stdout())
        .expect("Failed to run migrations");

    println!("Finishing running migrations");

    return database_url;
}
