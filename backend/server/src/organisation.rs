use crate::database::{
    models::{
        Campaign, NewOrganisation, NewOrganisationUser, Organisation, OrganisationUser, SuperUser,
        User,
    },
    schema::AdminLevel,
    Database,
    schema::AdminLevel,
};
use chrono::NaiveDateTime;
use rocket::{
    delete, get, post, put,
    serde::{json::Json, Serialize},
};
use std::collections::HashMap;

#[derive(Serialize)]
pub enum NewOrgError {
    OrgNameAlreadyExists,
    FailedToJoin,
}

#[derive(Serialize)]
pub enum OrgError {
    OrgNotFound,
    InsufficientPerms,
    UserIsNotInOrg,
    UserAlreadyInOrg,
}

#[post("/new", data = "<organisation>")]
pub async fn new(
    organisation: Json<NewOrganisation>,
    user: SuperUser,
    db: Database,
) -> Result<(), Json<NewOrgError>> {
    db.run(move |conn| {
        let org = NewOrganisation::insert(&organisation, &conn)
            .ok_or(Json(NewOrgError::OrgNameAlreadyExists))?;

        let org_user = NewOrganisationUser {
            user_id: user.user().id,
            organisation_id: org.id,
            admin_level: AdminLevel::Admin,
        };

        org_user
            .insert(conn)
            .ok_or(Json(NewOrgError::FailedToJoin))?;

        Ok(())
    })
    .await
}

// ============ /organisation/<org_id> ============

#[get("/<org_id>")]
pub async fn get_from_id(
    org_id: i32,
    _user: User,
    db: Database,
) -> Result<Json<Organisation>, Json<OrgError>> {
    db.run(move |conn| {
        Organisation::get_from_id(&conn, org_id)
            .ok_or(Json(OrgError::OrgNotFound))
            .map(|v| Json(v))
    })
    .await
}

#[get("/", data = "<orgs>")]
pub async fn get_from_ids(
    orgs: Json<Vec<i32>>,
    _user: User,
    db: Database,
) -> Result<Json<HashMap<i32, Organisation>>, Json<OrgError>> {
    db.run(move |conn| {
        let mut res = HashMap::with_capacity(orgs.len());

        for id in orgs.into_inner() {
            res.insert(
                id,
                Organisation::get_from_id(&conn, id).ok_or(Json(OrgError::OrgNotFound))?,
            );
        }

        Ok(Json(res))
    })
    .await
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
                return Err(Json(OrgError::InsufficientPerms));
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

#[derive(Serialize)]
pub struct CampaignResponse {
    pub id: i32,
    pub name: String,
    pub cover_image: Option<Vec<u8>>,
    pub description: String,
    pub starts_at: NaiveDateTime,
    pub ends_at: NaiveDateTime,
    pub published: bool,
}

impl std::convert::From<Campaign> for CampaignResponse {
    fn from(campaign: Campaign) -> Self {
        Self {
            id: campaign.id,
            name: campaign.name,
            cover_image: campaign.cover_image,
            description: campaign.description,
            starts_at: campaign.starts_at,
            ends_at: campaign.ends_at,
            published: campaign.published,
        }
    }
}

#[derive(Serialize)]
pub struct GetCampaignsResponse {
    campaigns: Vec<CampaignResponse>,
}

#[get("/<org_id>/campaigns")]
pub async fn get_associated_campaigns(
    org_id: i32,
    user: User,
    db: Database,
) -> Json<GetCampaignsResponse> {
    db.run(move |conn| {
        let is_director = OrganisationUser::organisation_admin_level(org_id, user.id, conn)
            .is_at_least_director()
            .check()
            .is_ok();

        Json(GetCampaignsResponse {
            campaigns: Campaign::get_all_from_org_id(conn, org_id)
                .into_iter()
                .filter(|v| v.published || is_director)
                .map(CampaignResponse::from)
                .collect(),
        })
    })
    .await
}

#[post("/<organisation_id>/invite/<user_id>", data = "<admin_level>")]
pub async fn invite_uid(
    organisation_id: i32,
    admin_level: Json<AdminLevel>,
    user_id: i32,
    user: User,
    db: Database,
) -> Result<(), Json<OrgError>> {
    db.run(move |conn| {
        let mut level = OrganisationUser::organisation_admin_level(organisation_id, user.id, conn)
            .check()
            .map_err(|_| Json(OrgError::InsufficientPerms))?
            .0;

        if user.superuser {
            level = AdminLevel::Admin;
        }

        let admin_level = admin_level.into_inner();

        if level.geq(admin_level) {
            let new_user = NewOrganisationUser {
                user_id,
                organisation_id,
                admin_level,
            };

            new_user
                .insert(conn)
                .map(|_| ())
                .ok_or(Json(OrgError::UserAlreadyInOrg))
        } else {
            Err(Json(OrgError::InsufficientPerms))
        }
    })
    .await
}
