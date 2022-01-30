use crate::database::{
    models::{Campaign, NewCampaignInput, OrganisationUser, Role, UpdateCampaignInput, User},
    Database,
};
use rocket::{delete, form::Form, get, post, put, serde::json::Json};
use serde::Serialize;

#[derive(Serialize)]
pub enum CampaignError {
    CampaignNotFound,
    Unauthorized,
    UnableToCreate,
}

#[get("/<campaign_id>")]
pub async fn get(campaign_id: i32, db: Database) -> Result<Json<Campaign>, Json<CampaignError>> {
    let campaign = db
        .run(move |conn| Campaign::get_from_id(conn, campaign_id))
        .await;

    match campaign {
        Some(campaign) => Ok(Json(campaign)),
        None => Err(Json(CampaignError::CampaignNotFound)),
    }
}

#[get("/all")]
pub async fn get_all_campaigns(_user: User, db: Database) -> Json<Vec<Campaign>> {
    let campaigns = db.run(|conn| Campaign::get_all_public(conn)).await;

    Json(campaigns)
}

#[put("/<campaign_id>", data = "<update_campaign>")]
pub async fn update(
    campaign_id: i32,
    update_campaign: Form<UpdateCampaignInput>,
    user: User,
    db: Database,
) -> Result<Json<()>, Json<CampaignError>> {
    db.run(move |conn| {
        OrganisationUser::campaign_admin_level(campaign_id, user.id, &conn)
            .is_at_least_director()
            .check()
            .or_else(|_| Err(Json(CampaignError::Unauthorized)))?;

        Campaign::update(conn, campaign_id, &update_campaign);

        Ok(Json(()))
    })
    .await
}

#[post("/new", data = "<new_campaign>")]
pub async fn create(
    new_campaign: Json<NewCampaignInput>,
    user: User,
    db: Database,
) -> Result<Json<Campaign>, Json<CampaignError>> {
    let inner = new_campaign.into_inner();
    db.run(move |conn| {
        OrganisationUser::organisation_admin_level(inner.organisation_id, user.id, &conn)
            .is_at_least_director()
            .check()
            .or_else(|_| Err(Json(CampaignError::Unauthorized)))?;

        let campaign =
            Campaign::create(conn, &inner).ok_or_else(|| Json(CampaignError::UnableToCreate))?;

        Ok(Json(campaign))
    })
    .await
}

#[delete("/<campaign_id>")]
pub async fn delete_campaign(
    campaign_id: i32,
    user: User,
    db: Database,
) -> Result<Json<()>, Json<CampaignError>> {
    db.run(move |conn| {
        // need to be admin to create new campaign
        OrganisationUser::campaign_admin_level(campaign_id, user.id, &conn)
            .is_admin()
            .check()
            .or_else(|_| Err(Json(CampaignError::Unauthorized)))?;

        Campaign::delete_deep(conn, campaign_id);

        Ok(Json(()))
    })
    .await
}

#[derive(Serialize)]
pub struct RolesResponse {
    roles: Vec<Role>,
}

#[derive(Serialize)]
pub enum RolesError {
    CampaignNotFound,
    Unauthorized,
    RoleAlreadyExists,
}

#[get("/<campaign_id>/roles")]
pub async fn roles(
    campaign_id: i32, // campaign_id has namespace conflict
    user: User,
    db: Database,
) -> Result<Json<RolesResponse>, Json<RolesError>> {
    db.run(move |conn| {
        let campaign = Campaign::get_from_id(conn, campaign_id)
            .ok_or_else(|| Json(RolesError::CampaignNotFound))?;

        OrganisationUser::campaign_admin_level(campaign_id, user.id, &conn)
            .is_at_least_director()
            .and(campaign.draft) // is at least director AND campaign is a draft
            .check()
            .or_else(|_| Err(Json(RolesError::Unauthorized)))?;

        let roles = Role::get_all_from_campaign_id(conn, campaign.id);

        Ok(Json(RolesResponse { roles }))
    })
    .await
}
