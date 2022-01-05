use crate::database::{
    models::{Campaign, NewOrganisation, Organisation, SuperUser, User},
    Database,
};

use serde::{Deserialize, Serialize};

use rocket::{
    delete,
    form::Form,
    get, post, put,
    serde::json::Json,
};

#[derive(Serialize)]
pub enum CampaignError {
    CampaignNotFound,
}

#[get("/campaign/<campaign_id>")]
pub async fn get_campaign(
    campaign_id: i32,
    db: Database,
) -> Result<Json<Campaign>, Json<CampaignError>> {
    let campaign = db.run(move |conn|
        Campaign::get_from_id(conn, campaign_id)
    ).await;

    match campaign {
        Some(campaign) => Ok(Json(campaign)),
        None => Err(Json(CampaignError::CampaignNotFound)),
    }
}

#[get("/campaign/<campaign_id>/roles")]
pub fn roles(
    campaign_id: i32,
    user: User,
    db: Database,
) -> Json<Vec<String>> {
    todo!()
}
