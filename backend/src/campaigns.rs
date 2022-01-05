use crate::database::{
    models::{Campaign, UpdateCampaign, NewOrganisation, Organisation, SuperUser, User, OrganisationUser, Role},
    Database, schema::AdminLevel,
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
    Unauthorized
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

#[put("/campaign/<campaign_id>", data = "<update_campaign>")]
pub async fn update_campaign(
    campaign_id: i32,
    update_campaign: Form<UpdateCampaign>,
    user: User,
    db: Database,
) -> Result<Json<()>, Json<CampaignError>> {
   
    let campaign = db.run(move |conn|
        Campaign::get_from_id(conn, campaign_id)
    ).await;
    let campaign = campaign.ok_or(Json(CampaignError::CampaignNotFound))?;

    let org_user = db.run(move |conn| {
        OrganisationUser::get(conn, campaign.organisation_id, user.id)
    }).await;
    let org_user = org_user.ok_or(Json(CampaignError::Unauthorized))?;

    if !user.superuser && org_user.admin_level == AdminLevel::ReadOnly {
        return Err(Json(CampaignError::Unauthorized));
    }

    // only update if admin_level is not AdminLevel::ReadOnly
    // ie, director, Admin (exec) or SuperUser
    let campaign = db.run(move |conn|
        Campaign::update(conn, campaign_id, &update_campaign)
    ).await;


    Ok(Json(()))
}


#[derive(Serialize)]
pub struct RolesResponse {
    roles: Vec<Role>,
}

#[derive(Serialize)]
pub enum RolesError {
    CampaignNotFound,
    Unauthorized,
}

#[get("/campaign/<campaign_id>/roles")]
pub async fn roles(
    campaign_id: i32,
    user: User,
    db: Database,
) -> Result<Json<RolesResponse>, Json<RolesError>> {
    let campaign = db.run(move |conn|
        Campaign::get_from_id(conn, campaign_id)
    ).await;

    let campaign = campaign.ok_or(Json(RolesError::CampaignNotFound))?;

    let (org_user, roles) = db.run(move |conn| 
        (
            OrganisationUser::get(conn, campaign.organisation_id, user.id),
            Role::get_all_from_campaign_id(conn, campaign.id),
        )
    ).await;

    let permission = org_user.map(|user| user.admin_level)
        .unwrap_or(AdminLevel::ReadOnly);

    // Prevent people from viewing while it's in draft mode,
    // unless they have adequate permissions
    if campaign.draft && !user.superuser && permission == AdminLevel::ReadOnly {
        return Err(Json(RolesError::Unauthorized));
    }

    Ok(Json(RolesResponse {
        roles
    }))
}
