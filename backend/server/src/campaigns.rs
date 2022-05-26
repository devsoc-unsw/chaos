use crate::database::{
    models::{
        Application, Campaign, CampaignWithRoles, NewCampaignInput, OrganisationUser, Role,
        UpdateCampaignInput, User,
        Campaign, CampaignWithRoles, NewCampaignInput, OrganisationUser, Role, UpdateCampaignInput,
        User, Application,
    },
    Database,
};
use crate::role::GetApplicationsResponse;
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

#[derive(Serialize)]
pub struct DashboardCampaignGroupings {
    pub current_campaigns: Vec<CampaignWithRoles>,
    pub past_campaigns: Vec<CampaignWithRoles>,
}

#[get("/all")]
pub async fn get_all_campaigns(user: User, db: Database) -> Json<DashboardCampaignGroupings> {
    let current_campaigns = db
        .run(move |conn| Campaign::get_all_public_with_roles(conn, user.id))
        .await;
    let past_campaigns = db
        .run(move |conn| Campaign::get_all_public_ended_with_roles(conn, user.id))
        .await;

    Json(DashboardCampaignGroupings {
        current_campaigns,
        past_campaigns,
    })
}

#[put("/<campaign_id>", data = "<update_campaign>")]
pub async fn update(
    campaign_id: i32,
    update_campaign: Json<UpdateCampaignInput>,
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
            .or(campaign.published) // only if not (read only and campaign is unpublished)
            .check()
            .or_else(|_| Err(Json(RolesError::Unauthorized)))?;

        let roles = Role::get_all_from_campaign_id(conn, campaign.id);

        Ok(Json(RolesResponse { roles }))
    })
    .await
}
