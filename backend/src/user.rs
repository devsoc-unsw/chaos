use crate::database::{
    models::{User},
    Database,
};
use rocket::{
    delete,
    form::Form,
    get, post, put,
    serde::{json::Json, Serialize},
};

#[derive(Serialize)]
pub enum UserError {
    UserNotFound,
}

#[get("/user_id>")]
pub async fn get_user(
    user_id: i32,
    _user: User,
    db: Database,
) -> Result<Json<User>, Json<OrgError>> {
    let res : Option<User> = db
        .run(move |conn| User::get_from_id(&conn, user_id))
        .await;
    
    match res {
        Some(user) => Ok(Json(user)),
        None => Err(Json(UserError::UserNotFound)),
    }
}