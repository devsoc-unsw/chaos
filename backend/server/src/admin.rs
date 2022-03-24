use crate::database::models::{CampaignInfo, AdminInfoResponse, OrganisationUserInfo, OrganisationInfo};

#[get("/admin")]
pub async fn get(user: User, db: Database) -> Json<AdminInfoResponse> {
    AdminInfoResponse { 
        organisations: db
            .run(move |conn| {
                user.get_all_org_ids_belonging(conn)
                    .into_iter()
                    .map(|x| OrganisationInfo::new(x, conn))
                    .collect::<Vec<OrganisationInfo>>()
            })
            .await
    }
}

