use crate::database::{
    models::{NewOrganisation, Organisation, SuperUser, User},
    Database,
};
use rocket::{
    form::Form,
    get, post,
    serde::{json::Json, Serialize}, delete,
};

#[derive(Serialize)]
pub enum NewOrgError {
    OrgNameAlreadyExists,
}

#[derive(Serialize)]
pub enum OrgError {
    OrgNotFound,
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

#[get("/<org_id>")]
pub async fn get_from_id(org_id: i32, _user: User, db: Database) -> Result<Json<Organisation>, Json<OrgError>> {
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
    let res: Option<usize> = db
        .run(move |conn| Organisation::delete(&conn, org_id))
        .await;

    match res {
        Some(_) => Ok(()),
        None => Err(Json(OrgError::OrgNotFound)),
    }
}
