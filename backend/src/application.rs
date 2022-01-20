use crate::database::{
    models::{NewOrganisation, Organisation, SuperUser, User},
    Database,
};
use rocket::{
    delete,
    form::Form,
    get, post, put,
    serde::{json::Json, Serialize},
};

#[derive(Serialize)]
pub enum ApplicationError {
    UserNotFound,
}

#[post("/<application_id>/comments", data = "<comment>")]
pub async fn create_comment(
    application_id: i32,
    comment: Form<NewOrganisation>,
    user: SuperUser,
    db: Database,
) -> Result<(), Json<ApplicationError>> {
    let res = db
        .run(move |conn| User::get_from_id(&conn, user.user().id))
        .await
        .ok_or_else(|| ApplicationError::UserNotFound)?;

    Ok(())
}
