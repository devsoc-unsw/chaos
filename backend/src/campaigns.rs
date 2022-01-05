use crate::database::{
    models::{Campaign, NewOrganisation, Organisation, SuperUser, User},
    Database,
};

use serde::{Deserialize, Serialize};

use rocket::{
    delete,
    form::Form,
    get, post, put,
    serde::{json::Json, Serialize},
};

#[derive(Serialize)]
pub enum CampignError {
    CampignNotFound,
}

#[get("/campaign/<campaign_id>")]
pub fn get_campaign(
    org_id: i32,
    campaign_id: i32,
    db: Database,
) -> Result<Json<Campaign>, Json<CampignError>> {
    match Campaign::get_from_id(campaign_id) {
        Some(campaign) => Ok(Json(campaign)),
        None => Err(Json(CampignNotFound)),
    }
}
