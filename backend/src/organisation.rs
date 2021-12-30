use crate::database::{Database, models::{SuperUser, Organisation, NewOrganisation}};
use rocket::{post, form::Form, serde::{Serialize, json::Json}};


#[derive(Serialize)]
pub enum NewOrgError {
    OrgNameAlreadyExists,
}


#[post("/new", data = "<organisation>")]
pub async fn new(organisation: Form<NewOrganisation>, _user: SuperUser, db: Database) -> Result<(), Json<NewOrgError>> {
    
    let res: Option<Organisation> = db.run(move |conn| {
        NewOrganisation::insert(&organisation, &conn)
    }).await;

    match res {
        Some(_) => Ok(()),
        None => Err(Json(NewOrgError::OrgNameAlreadyExists)),
    }

}
