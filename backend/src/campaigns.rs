use crate::database::{
    models::{NewOrganisation, Organisation, SuperUser, User},
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
    CampignNotFound
}


#[get("/organisation/<org_id>/campaign/<campaign_id>")]
pub fn get_campaign(org_id: i32, campaign_id: i32, db: Database) -> Json<Organisation> {
    let org = db.get_organisation(org_id);
    match org {
        Some(org) => {
            let campaign = org.get_campaign(campaign_id);
            match campaign {
                Some(campaign) => Json(campaign),
                None => Json(org),
            }
        }
        None => Json(Organisation {
            id: 0,
            name: "".to_string(),
            campaigns: vec![],
        }),
    }
    let campaign = org.get_campaign(campaign_id);
    Json(campaign)
}
