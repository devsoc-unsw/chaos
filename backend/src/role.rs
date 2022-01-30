use crate::database::models::RoleUpdate;
use crate::database::{
    models::{
        Campaign, OrganisationDirector, OrganisationDirectorError, OrganisationUser, Role, User,
    },
    schema::AdminLevel,
    Database,
};
use rocket::{
    delete,
    form::Form,
    get, post, put,
    serde::{json::Json, Serialize},
};

#[derive(Serialize)]
pub enum RoleError {
    RoleUpdateFailure,
    RoleNotFound,
    CampaignNotFound,
    Unauthorized,
    RoleAlreadyExists,
}

#[derive(Serialize)]
pub struct RoleResponse {
    name: String,
    description: Option<String>,
    min_available: i32,
    max_available: i32,
}

impl From<Role> for RoleResponse {
    fn from(role: Role) -> Self {
        RoleResponse {
            name: role.name,
            description: role.description,
            min_available: role.min_available,
            max_available: role.max_available,
        }
    }
}

#[get("/<role_id>")]
pub async fn get_role(
    role_id: i32,
    _user: User,
    db: Database,
) -> Result<Json<RoleResponse>, Json<RoleError>> {
    let res = db.run(move |conn| Role::get_from_id(&conn, role_id)).await;

    match res {
        Some(role) => Ok(Json(RoleResponse::from(role))),
        None => Err(Json(RoleError::RoleNotFound)),
    }
}

async fn error_if_unauthorised(
    role_id: i32,
    user: User,
    db: &Database,
) -> Result<(), Json<RoleError>> {
    // check for valid role
    let role = db
        .run(move |conn| Role::get_from_id(conn, role_id))
        .await
        .ok_or(Json(RoleError::RoleNotFound))?;

    // && user is authorised for (campaign -> Organisation) that controls user
    // this code is super jank atm - just need to get it working
    let campaign = db
        .run(move |conn| Campaign::get_from_id(conn, role.campaign_id))
        .await
        .ok_or(Json(RoleError::CampaignNotFound))?;

    let org_user = db
        .run(move |conn| OrganisationUser::get(conn, campaign.organisation_id, user.id))
        .await
        .ok_or(Json(RoleError::Unauthorized))?;

    if !user.superuser && org_user.admin_level == AdminLevel::ReadOnly {
        return Err(Json(RoleError::Unauthorized));
    }

    Ok(())
}

#[put("/<role_id>", data = "<role_update>")]
pub async fn update_role(
    role_id: i32,
    role_update: Form<RoleUpdate>,
    user: User,
    db: Database,
) -> Result<Json<RoleResponse>, Json<RoleError>> {
    // check auth
    error_if_unauthorised(role_id, user, &db).await?;

    // update valid user
    let res = db
        .run(move |conn| Role::update(conn, role_id, &role_update))
        .await;

    match res {
        Some(role) => Ok(Json(RoleResponse::from(role))),
        None => Err(Json(RoleError::RoleUpdateFailure)),
    }
}

#[delete("/<role_id>")]
pub async fn delete_role(role_id: i32, user: User, db: Database) -> Result<(), Json<RoleError>> {
    // check auth
    error_if_unauthorised(role_id, user, &db).await?;

    // deletes user deep (questions & applications)
    let res = db.run(move |conn| Role::delete_deep(conn, role_id)).await;

    match res {
        Some(_) => Ok(()),
        None => Err(Json(RoleError::RoleUpdateFailure)),
    }
}

impl std::convert::From<OrganisationDirectorError> for Json<RoleError> {
    fn from(e: OrganisationDirectorError) -> Self {
        Json(match e {
            OrganisationDirectorError::Unauthorized => RoleError::Unauthorized,
            _ => RoleError::CampaignNotFound,
        })
    }
}

#[post("/new", data = "<role>")]
pub async fn new_role(
    role: Form<RoleUpdate>,
    user: User,
    db: Database,
) -> Result<(), Json<RoleError>> {
    db.run(move |conn| {
        let org_director = OrganisationDirector::new_from_campaign_id(user, role.campaign_id, conn);

        // Only insert if user is a valid org director
        match org_director {
            Ok(_) => RoleUpdate::insert(&role, &conn).ok_or(Json(RoleError::RoleAlreadyExists)),
            Err(e) => Err(e.into()),
        }
    })
    .await
    .map(|_| ())
}
