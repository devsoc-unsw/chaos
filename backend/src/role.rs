use crate::database::{
    models::{OrganisationUser, Role, RoleUpdate, User},
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

#[put("/<role_id>", data = "<role_update>")]
pub async fn update_role(
    role_id: i32,
    role_update: Form<RoleUpdate>,
    user: User,
    db: Database,
) -> Result<Json<RoleResponse>, Json<RoleError>> {
    db.run(move |conn| {
        OrganisationUser::role_admin_level(role_id, user.id, &conn)
            .is_at_least_director()
            .check()
            .or_else(|_| Err(Json(RoleError::Unauthorized)))?;

        let role = Role::update(conn, role_id, &role_update)
            .ok_or_else(|| Json(RoleError::RoleUpdateFailure))?;

        Ok(Json(role.into()))
    })
    .await
}

#[delete("/<role_id>")]
pub async fn delete_role(role_id: i32, user: User, db: Database) -> Result<(), Json<RoleError>> {
    db.run(move |conn| {
        OrganisationUser::role_admin_level(role_id, user.id, &conn)
            .is_at_least_director()
            .check()
            .or_else(|_| Err(Json(RoleError::Unauthorized)))?;

        Role::delete_deep(conn, role_id).ok_or_else(|| Json(RoleError::RoleUpdateFailure))?;

        Ok(())
    })
    .await
}

#[post("/new", data = "<role>")]
pub async fn new_role(
    role: Form<RoleUpdate>,
    user: User,
    db: Database,
) -> Result<(), Json<RoleError>> {
    db.run(move |conn| {
        OrganisationUser::campaign_admin_level(role.campaign_id, user.id, &conn)
            .is_at_least_director()
            .check()
            .or_else(|_| Err(Json(RoleError::Unauthorized)))?;

        RoleUpdate::insert(&role, &conn).ok_or_else(|| Json(RoleError::RoleAlreadyExists))?;

        Ok(())
    })
    .await
}
