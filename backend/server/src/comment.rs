use crate::database::{
    models::{Comment, NewComment, OrganisationUser, User},
    Database,
};
use crate::error::JsonErr;
use rocket::{
    get,
    http::Status,
    post,
    serde::{json::Json, Deserialize, Serialize},
};

#[derive(Deserialize)]
pub struct NewCommentInput {
    pub application_id: i32,
    pub description: String,
}

#[derive(Serialize)]
pub enum CommentError {
    Unauthorized,
    CouldNotInsert,
    CommentNotFound,
}

#[post("/", data = "<new_comment_input>")]
pub async fn create_comment(
    new_comment_input: Json<NewCommentInput>,
    user: User,
    db: Database,
) -> Result<Json<Comment>, JsonErr<CommentError>> {
    // need to be director to comment
    let app_id = new_comment_input.application_id; // stack copy of i32
    db.run(move |conn| {
        OrganisationUser::application_admin_level(app_id, user.id, &conn)
            .is_at_least_director()
            .check()
    })
    .await
    .or_else(|_| Err(JsonErr(CommentError::Unauthorized, Status::Forbidden)))?;

    let new_comment = NewComment {
        application_id: new_comment_input.application_id,
        commenter_user_id: user.id,
        description: new_comment_input.description.to_string(),
    };
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
