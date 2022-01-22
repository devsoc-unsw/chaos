use crate::database::{
    models::{Comment, NewComment, SuperUser},
    Database,
};
use rocket::{
    form::Form,
    get, post,
    serde::{json::Json, Serialize},
};

#[derive(Serialize)]
pub enum CommentError {
    CouldNotInsert,
    CommentNotFound,
}

#[post("/new", data = "<new_comment>")]
pub async fn create_comment(
    new_comment: Form<NewComment>,
    _user: SuperUser,
    db: Database,
) -> Result<Json<Comment>, Json<CommentError>> {
    let comment = db
        .run(move |conn| NewComment::insert(&new_comment, conn))
        .await
        .ok_or_else(|| Json(CommentError::CouldNotInsert))?;

    Ok(Json(comment))
}

#[get("/<comment_id>")]
pub async fn get_comment_from_id(
    comment_id: i32,
    _user: SuperUser,
    db: Database,
) -> Result<Json<Comment>, Json<CommentError>> {
    let comment = db
        .run(move |conn| Comment::get_from_id(conn, comment_id))
        .await
        .ok_or_else(|| Json(CommentError::CommentNotFound))?;

    Ok(Json(comment))
}
