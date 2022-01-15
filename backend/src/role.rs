use crate::database::models::RoleUpdateInput;
use crate::database::{
    models::{Campaign, OrganisationUser, Role, User},
    schema::AdminLevel,
    Database,
};
use rocket::{
    form::Form,
    get, put,
    serde::{json::Json, Serialize},
};

#[derive(Serialize)]
pub enum RoleError {
    RoleUpdateFailure,
    RoleNotFound,
    CampaignNotFound,
    Unauthorized,
}

#[derive(Serialize)]
pub struct RoleResponse {
    name: String,
    description: Option<String>,
    min_available: i32,
    max_available: i32,
}

#[get("/<role_id>")]
pub async fn get_role(
    role_id: i32,
    _user: User,
    db: Database,
) -> Result<Json<RoleResponse>, Json<RoleError>> {
    let res: Option<Role> = db.run(move |conn| Role::get_from_id(&conn, role_id)).await;

    match res {
        Some(role_) => Ok(Json(RoleResponse {
            name: role_.name,
            description: role_.description,
            min_available: role_.min_available,
            max_available: role_.max_available,
        })),
        None => Err(Json(RoleError::RoleNotFound)),
    }
}

#[put("/<role_id>", data = "<role_update>")]
pub async fn update_role(
    role_id: i32,
    role_update: Form<RoleUpdateInput>,
    _user: User,
    db: Database,
) -> Result<Json<RoleResponse>, Json<RoleError>> {
    // check for valid role
    let role = db.run(move |conn| Role::get_from_id(conn, role_id)).await;
    let role = role.ok_or(Json(RoleError::RoleNotFound))?;

    // && user is authorised for (campaign -> Organisation) that controls user
    // this code is super jank atm - just need to get it working
    let campaign = db
        .run(move |conn| Campaign::get_from_id(conn, role.campaign_id))
        .await;
    let campaign = campaign.ok_or(Json(RoleError::CampaignNotFound))?;

    let org_user = db
        .run(move |conn| OrganisationUser::get(conn, campaign.organisation_id, _user.id))
        .await;
    let org_user = org_user.ok_or(Json(RoleError::Unauthorized))?;

    if !_user.superuser && org_user.admin_level == AdminLevel::ReadOnly {
        return Err(Json(RoleError::Unauthorized));
    }

    // update valid user
    let res: Option<Role> = db
        .run(move |conn| Role::update(conn, role_id, &role_update))
        .await;
    match res {
        Some(role_) => Ok(Json(RoleResponse {
            name: role_.name,
            description: role_.description,
            min_available: role_.min_available,
            max_available: role_.max_available,
        })),
        None => Err(Json(RoleError::RoleUpdateFailure)),
    }
}
