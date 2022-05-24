use crate::database::{
    models::{Application, NewApplication, NewRating, OrganisationUser, User},
    Database,
};
use rocket::{
    form::Form,
    post, put,
    serde::{json::Json, Serialize, Deserialize},
    FromForm,
};

#[derive(Serialize)]
pub enum ApplicationError {
    Unauthorized,
    UserNotFound,
    RoleNotFound,
    UnableToCreate,
}

#[post("/new", data = "<new_application>")]
pub async fn create_application(
    new_application: Json<NewApplication>,
    _user: User,
    db: Database,
) -> Result<Json<Application>, Json<ApplicationError>> {
    let application = db
        .run(move |conn| NewApplication::insert(&new_application, conn))
        .await
        .ok_or(Json(ApplicationError::UnableToCreate))?;

    Ok(Json(application))
}

#[derive(FromForm, Deserialize)]
pub struct RatingInput {
    rating: i32,
}

#[put("/<application_id>/rating", data = "<rating>")]
pub async fn create_rating(
    application_id: i32,
    rating: Json<RatingInput>,
    user: User,
    db: Database,
) -> Result<Json<()>, Json<ApplicationError>> {
    db.run(move |conn| {
        OrganisationUser::application_admin_level(application_id, user.id, &conn)
            .is_at_least_director()
            .check()
            .or_else(|_| Err(ApplicationError::Unauthorized))?;

        NewRating::insert(
            &NewRating {
                application_id: application_id,
                rater_user_id: user.id,
                rating: rating.rating,
            },
            &conn,
        )
        .ok_or_else(|| ApplicationError::UnableToCreate)?;

        Ok(Json(()))
    })
    .await
}
