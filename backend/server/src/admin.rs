use crate::database::{
    models::{AdminInfoResponse, OrganisationInfo, OrganisationUser, SuperUser, User},
    Database,
};
use crate::error::JsonErr;
use rocket::{get, http::Status, post, serde::json::Json};

#[get("/")]
pub async fn get(user: User, db: Database) -> Json<AdminInfoResponse> {
    Json(AdminInfoResponse {
        organisations: db
            .run(move |conn| {
                user.get_all_org_ids_belonging(conn)
                    .into_iter()
                    .filter(|org_id| {
                        OrganisationUser::organisation_admin_level(*org_id, user.id, conn)
                            .is_at_least_director()
                            .check()
                            .is_ok()
                    })
                    .map(|org| OrganisationInfo::new(org, conn))
                    .collect::<Vec<OrganisationInfo>>()
            })
            .await,
    })
}

#[post("/make_superuser", data = "<email>")]
pub async fn make_superuser(
    _user: SuperUser,
    db: Database,
    email: Json<String>,
) -> Result<(), JsonErr<()>> {
    db.run(move |conn| {
        User::get_from_email(conn, &email.into_inner())
            .map(|user| user.make_superuser(conn).ok())
            .flatten()
    })
    .await
    .ok_or(JsonErr((), Status::BadRequest))
}
