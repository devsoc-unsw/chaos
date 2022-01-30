use crate::database::{
    models::{Comment, NewComment, OrganisationDirector, User},
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
    // comment is tied to application, tied to role, tied to campaign, tied to org
    // comment maker needs to have permission in org - OrganisationDirector (OrganisationUsers)
    let app_id = new_comment.application_id; // stack copy of i32
    let org_id = db
        .run(move |conn| Comment::app_id_to_org_id(&conn, app_id))
        .await
        .ok_or_else(|| Json(CommentError::Unauthorized))?;

    db.run(move |conn| OrganisationDirector::new_from_org_id(user, org_id, &conn))
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
    let org_id = db
        .run(move |conn| Comment::comment_id_to_org_id(&conn, comment_id))
        .await
        .ok_or_else(|| Json(CommentError::Unauthorized))?;

    db.run(move |conn| OrganisationDirector::new_from_org_id(user, org_id, &conn))
        .await
        .or_else(|_| Err(Json(CommentError::Unauthorized)))?;

    let comment = db
        .run(move |conn| Comment::get_from_id(conn, comment_id))
        .await
        .ok_or_else(|| Json(CommentError::CommentNotFound))?;

    Ok(Json(comment))
}
