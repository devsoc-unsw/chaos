use crate::database::{
    models::{Application, NewApplication, User},
    Database,
};
use rocket::{
    form::Form,
    post, put,
    serde::{json::Json, Serialize},
    FromForm,
};

#[derive(Serialize)]
pub enum ApplicationError {
    UserNotFound,
    RoleNotFound,
    UnableToCreate,
}

#[post("/new", data = "<new_application>")]
pub async fn create_application(
    new_application: Form<NewApplication>,
    _user: User,
    db: Database,
) -> Result<Json<Application>, Json<ApplicationError>> {
    let application = db
        .run(move |conn| NewApplication::insert(&new_application, conn))
        .await
        .ok_or(Json(ApplicationError::UnableToCreate))?;

    Ok(Json(application))
}

#[derive(FromForm)]
pub struct RatingInput {
    rating: i32,
}

#[put("/<application_id>/rating", data = "<rating>")]
pub async fn create_rating(
    application_id: i32,
    rating: Form<RatingInput>,
    _user: User,
    _db: Database, // ) -> Result<Json<()>, Json<ApplicationError>>{
) {
    ()
}
