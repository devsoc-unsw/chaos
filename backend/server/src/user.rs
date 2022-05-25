use crate::database::{
    models::{Campaign, User},
    Database,
};
use diesel::PgConnection;
use rocket::{
    get,
    serde::{json::Json, Serialize},
};

#[derive(Serialize)]
pub enum UserError {
    UserNotFound,
    CampaignNotFound,
    PermissionDenied,
}

#[derive(Serialize)]
pub struct UserResponse {
    email: String,
    zid: String,
    display_name: String,
    degree_name: String,
    degree_starting_year: i32,
}

// TODO: implement
fn user_is_boss(boss_user: &User, user: &User, conn: &PgConnection) -> bool {
    boss_user.id == user.id
}

#[get("/<user_id>")]
pub async fn get_user(
    user_id: i32,
    user: User,
    db: Database,
) -> Result<Json<UserResponse>, Json<UserError>> {
    db.run(move |conn| {
        let res = User::get_from_id(&conn, user_id).ok_or(Json(UserError::UserNotFound))?;
        if user_is_boss(&user, &res, conn) {
            Ok(Json(UserResponse {
                email: user.email,
                zid: user.zid,
                display_name: user.display_name,
                degree_name: user.degree_name,
                degree_starting_year: user.degree_starting_year,
            }))
        } else {
            Err(Json(UserError::PermissionDenied))
        }
    })
    .await
}

#[get("/campaigns")]
pub async fn get_user_campaigns(
    user: User,
    db: Database,
) -> Result<Json<Vec<Campaign>>, Json<UserError>> {
    let campaigns = db.run(move |conn| user.get_all_campaigns(conn)).await;

    Ok(Json(campaigns))
}
