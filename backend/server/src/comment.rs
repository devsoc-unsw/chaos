use crate::database::{
    models::{Comment, NewComment, OrganisationUser, User},
    Database,
};
use crate::error::JsonErr;
use rocket::{
    form::Form,
    get,
    http::Status,
    post,
    serde::{json::Json, Serialize},
};

#[derive(Serialize)]
pub enum CommentError {
    Unauthorized,
    CouldNotInsert,
    CommentNotFound,
}

#[post("/new", data = "<new_comment>")]
pub async fn create_comment(
    new_comment: Form<NewComment>,
    user: User,
    db: Database,
) -> Result<Json<Comment>, JsonErr<CommentError>> {
    // need to be director to comment
    let app_id = new_comment.application_id; // stack copy of i32
    db.run(move |conn| {
        OrganisationUser::application_admin_level(app_id, user.id, &conn)
            .is_at_least_director()
            .check()
    })
    .await
    .or_else(|_| Err(JsonErr(CommentError::Unauthorized, Status::Forbidden)))?;

    let comment = db
        .run(move |conn| NewComment::insert(&new_comment, conn))
        .await
        .ok_or_else(|| JsonErr(CommentError::CouldNotInsert, Status::InternalServerError))?;

    Ok(Json(comment))
}

#[get("/<comment_id>")]
pub async fn get_comment_from_id(
    comment_id: i32,
    user: User,
    db: Database,
) -> Result<Json<Comment>, JsonErr<CommentError>> {
    db.run(move |conn| {
        OrganisationUser::comment_admin_level(comment_id, user.id, &conn)
            .is_at_least_director()
            .check()
    })
    .await
    .or_else(|_| Err(JsonErr(CommentError::Unauthorized, Status::Forbidden)))?;

    let comment = db
        .run(move |conn| Comment::get_from_id(conn, comment_id))
        .await
        .ok_or_else(|| JsonErr(CommentError::CommentNotFound, Status::NotFound))?;

    Ok(Json(comment))
}
