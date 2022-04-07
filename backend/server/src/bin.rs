extern crate diesel;

use backend::auth::Auth;
use backend::cors::cors;
use backend::database::Database;
use rocket::routes;

#[rocket::get("/foo")]
fn authed_call(auth: Auth) -> String {
    format!("hello, your user id is {}", auth.jwt.user_id)
}

#[rocket::main]
async fn main() {
    dotenv::dotenv().unwrap();

    let api_state = backend::state::api_state().await;

    let cors = cors();

    rocket::build()
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
                backend::campaigns::delete_campaign,
                backend::campaigns::get_all_campaigns,
            ],
        )
        .mount(
            "/user",
            routes![backend::user::get_user, backend::user::get_user_campaigns],
        )
        .mount(
            "/application",
            routes![backend::application::create_application],
        )
        .mount(
            "/role",
            routes![
                backend::role::get_role,
                backend::role::update_role,
                backend::role::new_role,
                backend::role::get_questions,
            ],
        )
        .mount(
            "/comment",
            routes![
                backend::comment::create_comment,
                backend::comment::get_comment_from_id
            ],
        )
        .mount("/admin", routes![backend::admin::get,])
        .launch()
        .await
        .unwrap();
}
