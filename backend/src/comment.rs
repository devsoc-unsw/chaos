use crate::database::{
    models::{Comment, NewComment, OrganisationUser, User},
    Database,
};
use rocket::{
    form::Form,
    get, post,
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
) -> Result<Json<Comment>, Json<CommentError>> {
    // need to be director to comment
    let app_id = new_comment.application_id; // stack copy of i32
    db.run(move |conn| {
        OrganisationUser::application_admin_level(app_id, user.id, &conn).is_at_least_director()
    })
    .await
    .or_else(|_| Err(Json(CommentError::Unauthorized)))?;

    let comment = db
        .run(move |conn| NewComment::insert(&new_comment, conn))
        .await
        .ok_or_else(|| Json(CommentError::CouldNotInsert))?;

    Ok(Json(comment))
}

#[get("/<comment_id>")]
pub async fn get_comment_from_id(
    comment_id: i32,
    user: User,
    db: Database,
) -> Result<Json<Comment>, Json<CommentError>> {
    db.run(move |conn| {
        OrganisationUser::comment_admin_level(comment_id, user.id, &conn).is_at_least_director()
    })
    .await
    .or_else(|_| Err(Json(CommentError::Unauthorized)))?;

    let comment = db
        .run(move |conn| Comment::get_from_id(conn, comment_id))
        .await
        .ok_or_else(|| Json(CommentError::CommentNotFound))?;

    Ok(Json(comment))
}
