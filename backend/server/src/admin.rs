use crate::database::{
    models::{AdminInfoResponse, CampaignInfo, OrganisationInfo, OrganisationUserInfo, User},
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
                    .map(|x| OrganisationInfo::new(x, conn))
                    .collect::<Vec<OrganisationInfo>>()
            })
            .await,
    })
}
