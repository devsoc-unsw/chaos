use crate::database::{
    models::{Comment, NewComment, SuperUser},
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

#[post("/new", data = "<new_comment>")]
pub async fn create_comment(
    new_comment: Form<NewComment>,
    _user: SuperUser,
    db: Database,
) -> Result<Json<Comment>, Json<ApplicationError>> {
    let comment = db
        .run(move |conn| NewComment::insert(&new_comment, conn))
        .await
        .ok_or_else(|| Json(ApplicationError::UserNotFound))?;

    Ok(Json(comment))
}
