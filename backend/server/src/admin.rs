use crate::database::{
    models::{AdminInfoResponse, OrganisationInfo, User, OrganisationUser},
    Database,
};
use rocket::{get, serde::json::Json};

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
