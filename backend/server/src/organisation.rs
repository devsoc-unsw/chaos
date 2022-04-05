use crate::database::{
    models::{NewOrganisation, Organisation, SuperUser, User},
    Database,
};
use rocket::{
    delete,
    form::Form,
    get, post, put,
    serde::{json::Json, Serialize},
};

#[derive(Serialize)]
pub enum NewOrgError {
    OrgNameAlreadyExists,
}

#[derive(Serialize)]
pub enum OrgError {
    OrgNotFound,
    UserIsNotAdmin,
}

#[post("/new", data = "<organisation>")]
pub async fn new(
    organisation: Form<NewOrganisation>,
    _user: SuperUser,
    db: Database,
) -> Result<(), Json<NewOrgError>> {
    let res: Option<Organisation> = db
        .run(move |conn| NewOrganisation::insert(&organisation, &conn))
        .await;

    match res {
        Some(_) => Ok(()),
        None => Err(Json(NewOrgError::OrgNameAlreadyExists)),
    }
}

// ============ /organisation/<org_id> ============

#[get("/<org_id>")]
pub async fn get_from_id(
    org_id: i32,
    _user: User,
    db: Database,
) -> Result<Json<Organisation>, Json<OrgError>> {
    let res: Option<Organisation> = db
        .run(move |conn| Organisation::get_from_id(&conn, org_id))
        .await;

    match res {
        Some(org) => Ok(Json(org)),
        None => Err(Json(OrgError::OrgNotFound)),
    }
}

#[delete("/<org_id>")]
pub async fn delete(org_id: i32, _user: SuperUser, db: Database) -> Result<(), Json<OrgError>> {
    db.run(move |conn| Organisation::delete_deep(&conn, org_id))
        .await
        .ok_or(Json(OrgError::OrgNotFound))
}

// ============ /organisation/<org_id>/superusers ============

#[get("/<org_id>/superusers")]
pub async fn get_admins(
    org_id: i32,
    _user: User,
    db: Database,
) -> Result<Json<Vec<i32>>, Json<OrgError>> {
    let res = db
        .run(move |conn| Organisation::get_admin_ids(&conn, org_id))
        .await;

    match res {
        Some(ids) => Ok(Json(ids)),
        None => Err(Json(OrgError::OrgNotFound)),
    }
}

#[put("/<org_id>/admins", data = "<admins>")]
pub async fn set_admins(
    org_id: i32,
    user: User,
    db: Database,
    admins: Json<Vec<i32>>,
) -> Result<Json<()>, Json<OrgError>> {
    let res = db
        .run(move |conn| Organisation::get_admin_ids(&conn, org_id))
        .await;

    match res {
        Some(ids) => {
            if !ids.contains(&user.id) {
                return Err(Json(OrgError::UserIsNotAdmin));
            } else {
                db.run(move |conn| Organisation::set_admins(&conn, org_id, &admins))
                    .await;
                Ok(Json(()))
            }
        }

        None => Err(Json(OrgError::OrgNotFound)),
    }
}

#[get("/<org_id>/is_admin")]
pub async fn is_admin(org_id: i32, user: User, db: Database) -> Json<bool> {
    let res = db
        .run(move |conn| Organisation::get_admin_ids(&conn, org_id))
        .await;

    match res {
        Some(ids) => Json(ids.contains(&user.id) || user.superuser),
        None => Json(false),
    }
}
