use crate::database::{
    models::{
        Application, Campaign, GetQuestionsResponse, OrganisationUser, Question, Role, RoleUpdate,
        User,
    },
    schema::ApplicationStatus,
    Database,
};
use crate::email::*;
use crate::error::JsonErr;
use chrono::NaiveDateTime;
use diesel::prelude::*;
use diesel::PgConnection;
use rocket::{
    delete, get,
    http::Status,
    post, put,
    serde::{json::Json, Deserialize, Serialize},
};
use std::collections::{HashMap, HashSet};

#[derive(Serialize)]
pub enum RoleError {
    RoleUpdateFailure,
    RoleNotFound,
    CampaignNotFound,
    Unauthorized,
    RoleAlreadyExists,
    InvalidExpr,
    InvalidVariable(String),
    InvalidMappings,
    NoMatchingBody,
    EmailError,
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
    role_update: Json<RoleUpdate>,
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
    role: Json<RoleUpdate>,
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

#[derive(Serialize)]
pub enum QuestionsError {
    RoleNotFound,
    CampaignNotFound,
    Unauthorized,
    UserNotFound,
}

#[get("/<role_id>/questions")]
pub async fn get_questions(
    role_id: i32,
    user: User,
    db: Database,
) -> Result<Json<GetQuestionsResponse>, Json<QuestionsError>> {
    // First check that the role is valid and the user should be able to access the ids.
    // We can't use the helper function below since behaviour depends on the draft
    // status of the campaign.

    db.run(move |conn| {
        let role = Role::get_from_id(conn, role_id).ok_or(Json(QuestionsError::RoleNotFound))?;
        let campaign = Campaign::get_from_id(conn, role.campaign_id)
            .ok_or(Json(QuestionsError::CampaignNotFound))?;

        // Prevent people from viewing while it's in draft mode,
        // unless they have adequate permissions
        OrganisationUser::campaign_admin_level(campaign.id, user.id, &conn)
            .is_at_least_director()
            .or(campaign.published)
            .check()
            .map_err(|_| Json(QuestionsError::Unauthorized))?;
        Ok(Json(GetQuestionsResponse {
            questions: Question::get_all_from_role_id(conn, role_id)
                .into_iter()
                .map(|x| x.into())
                .collect(),
        }))
    })
    .await
}

#[derive(Serialize)]
pub struct ApplicationResponse {
    pub id: i32,
    pub user_id: i32,
    pub user_email: String,
    pub user_zid: String,
    pub user_display_name: String,
    pub user_degree_name: String,
    pub user_degree_starting_year: i32,
    pub role_id: i32,
    pub status: ApplicationStatus,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

impl ApplicationResponse {
    pub fn from_application(app: Application, conn: &PgConnection) -> Option<Self> {
        let user = User::get_from_id(conn, app.user_id)?;

        Some(ApplicationResponse {
            id: app.id,
            user_id: app.user_id,
            user_display_name: user.display_name,
            user_email: user.email,
            user_degree_name: user.degree_name,
            user_degree_starting_year: user.degree_starting_year,
            user_zid: user.zid,
            role_id: app.role_id,
            status: app.status,
            created_at: app.created_at,
            updated_at: app.updated_at,
        })
    }
}

#[derive(Serialize)]
pub struct GetApplicationsResponse {
    pub applications: Vec<ApplicationResponse>,
}

#[get("/<role_id>/applications")]
pub async fn get_applications(
    role_id: i32,
    user: User,
    db: Database,
) -> Result<Json<GetApplicationsResponse>, Json<QuestionsError>> {
    // First check that the role is valid and the user should be able to access the ids.
    // We can't use the helper function below since behaviour depends on the draft
    // status of the campaign.

    db.run(move |conn| {
        // NOTE: admin_level doesn't give good error info when eg. role is not found
        // (just says unauthorized)
        OrganisationUser::role_admin_level(role_id, user.id, conn)
            .is_at_least_director()
            .check()
            .map_err(|_| QuestionsError::Unauthorized)?;

        let apps = Application::get_all_from_role_id(conn, role_id);
        let mut res_vec = Vec::with_capacity(apps.len());

        for app in apps {
            res_vec.push(
                ApplicationResponse::from_application(app, conn)
                    .ok_or(Json(QuestionsError::UserNotFound))?,
            );
        }

        Ok(Json(GetApplicationsResponse {
            applications: res_vec,
        }))
    })
    .await
}

impl std::convert::From<TemplateErr> for RoleError {
    fn from(x: TemplateErr) -> Self {
        match x {
            TemplateErr::InvalidExpr => RoleError::InvalidExpr,
            TemplateErr::InvalidVariable(s) => RoleError::InvalidVariable(s),
            TemplateErr::InvalidMappings => RoleError::InvalidMappings,
        }
    }
}

#[derive(Deserialize)]
pub enum Selection {
    #[serde(rename = "all")]
    All,
    #[serde(rename = "failed")]
    Failed,
    #[serde(rename = "succeeded")]
    Succeeded,
    #[serde(rename = "some")]
    Some(HashSet<i32>),
}

#[derive(Deserialize)]
pub struct EmailData {
    pub users: Selection,
    pub subject: String,
    pub success_body: Option<String>,
    pub failure_body: Option<String>,
    pub special_bodies: Option<HashMap<i32, String>>,
}

fn parse_optional(ms: Option<String>, vars: HashSet<String>) -> Result<Option<ParsedTemplate>, JsonErr<RoleError>> {
    match ms {
        Some(s) => Ok(Some(
            ParsedTemplate::from_template(s, vars)
                .map_err(|x| JsonErr(x.into(), Status::BadRequest))?
        )),
        None => Ok(None),
    }
}

#[post("/<role>/send_emails", data = "<data>")]
pub async fn send_emails(
    role: i32,
    user: User,
    db: Database,
    data: Json<EmailData>,
) -> Result<(), JsonErr<RoleError>> {
    use crate::database::schema::{applications, users};

    db.run(move |conn| {
        let role = Role::get_from_id(conn, role).ok_or(JsonErr(RoleError::RoleNotFound, Status::NotFound))?;

        let vars: HashSet<String> = [
            String::from("name"),
            String::from("role"),
        ]
        .into_iter()
        .collect();

        let EmailData { success_body, failure_body, special_bodies, subject, users } = data.into_inner();

        let mut success_parsed = parse_optional(success_body, vars.clone())?;
        let mut rejected_parsed = parse_optional(failure_body, vars.clone())?;
        let mut special_parsed = match special_bodies {
            Some(m) => {
                Some(m.into_iter().map(|(k, v)| {
                    ParsedTemplate::from_template(v, vars.clone())
                        .map_err(|x| JsonErr(x.into(), Status::BadRequest))
                        .map(|x| (k, Some(x)))
                }).collect::<Result<HashMap<_, _>, _>>()?)
            }
            None => None,
        };

        OrganisationUser::role_admin_level(role.id, user.id, conn)
            .is_admin()
            .check()
            .map_err(|_| JsonErr(RoleError::Unauthorized, Status::Forbidden))?;

        let epic_iter = applications::table
            .filter(applications::role_id.eq(role.id))
            .inner_join(users::table)
            .select((
                users::id,
                users::display_name,
                users::email,
                applications::status,
            ))
            .load(conn)
            .unwrap_or_else(|_| vec![])
            .into_iter();

        for (uid, name, email, status) in epic_iter {
            match users {
                Selection::All => (),
                Selection::Failed => {
                    if status != ApplicationStatus::Rejected {
                        continue;
                    }
                }
                Selection::Succeeded => {
                    if status != ApplicationStatus::Success {
                        continue;
                    }
                }
                Selection::Some(ref set) => {
                    if !set.contains(&uid) {
                        continue;
                    }
                }
            }

            let special = special_parsed.as_ref().map(|x| x.contains_key(&uid)).unwrap_or(false);
            let body = if special {
                special_parsed.as_mut().map(|x| x.get_mut(&uid).unwrap())
            } else {
                match status {
                    ApplicationStatus::Success => Some(&mut success_parsed),
                    ApplicationStatus::Rejected => Some(&mut rejected_parsed),
                    _ => None,
                }
            };

            if let Some(parsed) = body {
                let owned_body = parsed.take();
                let mapped = owned_body
                    .ok_or(JsonErr(RoleError::NoMatchingBody, Status::BadRequest))?
                    .to_mapped([(String::from("name"), name), (String::from("role"), role.name.clone())].into_iter().collect())
                    .map_err(|x| JsonErr(x.into(), Status::BadRequest))?;

                let email_body = mapped.render();

                *parsed = Some(mapped.into());

                send_email(email, subject.clone(), email_body).ok_or(JsonErr(RoleError::EmailError, Status::InternalServerError))?;
            } else {
                JsonErr(RoleError::NoMatchingBody, Status::BadRequest);
            }

        }

        Ok(())
    })
    .await
}
