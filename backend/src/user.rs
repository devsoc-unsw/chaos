use crate::database::{models::User, Database};
use rocket::{
    get,
    serde::{json::Json, Serialize},
};

#[derive(Serialize)]
pub enum UserError {
    UserNotFound,
}

#[derive(Serialize)]
pub struct UserResponse {
    email: String,
    zid: String,
    display_name: String,
    degree_name: String,
    degree_starting_year: i32,
}

#[get("/<user_id>")]
pub async fn get_user(
    user_id: i32,
    _user: User,
    db: Database,
) -> Result<Json<UserResponse>, Json<UserError>> {
    let res: Option<User> = db.run(move |conn| User::get_from_id(&conn, user_id)).await;

    match res {
        Some(user) => Ok(Json(UserResponse {
            email: user.email,
            zid: user.zid,
            display_name: user.display_name,
            degree_name: user.degree_name,
            degree_starting_year: user.degree_starting_year,
        })),
        None => Err(Json(UserError::UserNotFound)),
    }
}
