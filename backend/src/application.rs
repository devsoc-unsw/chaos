use crate::database::{
    models::{NewApplication, Role, SuperUser, User},
    Database,
};
use rocket::{
    form::Form,
    post,
    serde::{json::Json, Serialize},
};

#[derive(Serialize)]
pub enum ApplicationError {
    UserNotFound,
    RoleNotFound,
}

#[post("/<application_id>/comments", data = "<comment>")]
pub async fn create_comment(
    application_id: i32,
    comment: Form<NewApplication>,
    _user: SuperUser,
    db: Database,
) -> Result<(), Json<ApplicationError>> {
    let user = db
        .run(move |conn| User::get_from_id(&conn, comment.user_id))
        .await
        .ok_or_else(|| ApplicationError::UserNotFound)?;

    // let role = db
    // .run(move |conn| Role::get_from_id(&conn, comment.role_id))
    // .await
    // .ok_or_else(|| ApplicationError::UserNotFound)?;

    Ok(())
}
