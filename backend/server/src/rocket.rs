use crate::cors::cors;
use crate::database::Database;
use crate::{auth::Auth, images::IMAGE_BASE_PATH};
use diesel::pg::PgConnection;
use diesel::prelude::*;
use diesel_migrations::*;
use figment::{providers::Serialized, Figment};
use rocket::{routes, serde::json::Value, Rocket, Build};
use std::{env, fs, path::Path};


embed_migrations!();

#[rocket::get("/foo")]
fn authed_call(auth: Auth) -> String {
    format!("hello, your user id is {}", auth.jwt.user_id)
}


/*
    Builds rocket instance using environment variables

    Does not launch the rocket 
*/
pub async fn rocket() -> Rocket<Build> {
    dotenv::dotenv().ok();

    let db_url = run_migrations();

    let api_state = crate::state::api_state().await;

    let cors = cors();

    let config_map: Value = serde_json::from_str(&format!(
        r#"{{
            "databases": {{
                "database": {{
                    "url": "{}"
                }}
            }},
            "log_level": "debug",
            "address": "0.0.0.0",
            "limits": {{
                "json": "10485760"
            }}
        }}"#,
        db_url
    ))
    .unwrap();

    let figment = Figment::from(rocket::Config::default()).merge(Serialized::globals(config_map));

    // create images dir if not found
    //
    //
    // SUBJECT TO CHANGE
    //
    //
    fs::create_dir_all(Path::new(IMAGE_BASE_PATH)).ok();

    rocket::custom(figment)
        .manage(api_state)
        .attach(Database::fairing())
        .attach(cors)
        .mount("/", routes![authed_call])
        .mount(
            "/organisation",
            routes![
                crate::organisation::new,
                crate::organisation::get_from_id,
                crate::organisation::delete,
                crate::organisation::get_admins,
                crate::organisation::set_admins,
                crate::organisation::is_admin,
                crate::organisation::get_from_ids,
                crate::organisation::invite_uid,
                crate::organisation::invite_email,
                crate::organisation::set_logo,
            ],
        )
        .mount(
            "/auth",
            routes![crate::auth::signin, crate::auth::signup],
        )
        .mount(
            "/campaign",
            routes![
                crate::campaigns::get,
                crate::campaigns::update,
                crate::campaigns::roles,
                crate::campaigns::new,
                crate::campaigns::delete_campaign,
                crate::campaigns::get_all_campaigns,
                crate::campaigns::set_cover_image,
            ],
        )
        .mount(
            "/user",
            routes![
                crate::user::get_user,
                crate::user::get_user_campaigns,
                crate::user::get,
            ],
        )
        .mount(
            "/application",
            routes![
                crate::application::create_application,
                crate::application::create_rating,
                crate::application::submit_answer,
                crate::application::get_answers,
                crate::application::get_ratings,
                crate::application::set_status,
                crate::application::set_private_status,
                crate::application::get_comments,
            ],
        )
        .mount(
            "/role",
            routes![
                crate::role::get_role,
                crate::role::update_role,
                crate::role::new_role,
                crate::role::get_questions,
                crate::role::get_applications,
            ],
        )
        .mount(
            "/comment",
            routes![
                crate::comment::create_comment,
                crate::comment::get_comment_from_id
            ],
        )
        .mount(
            "/question",
            routes![
                crate::question::get_question,
                crate::question::edit_question,
                crate::question::delete_question
            ],
        )
        .mount(
            "/admin",
            routes![crate::admin::get, crate::admin::make_superuser],
        )
        .mount("/static", routes![crate::static_resources::files])
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
