use crate::database::{
    models::{
        Campaign, CampaignWithRoles, NewCampaignInput, NewQuestion, OrganisationUser, Role,
        RoleUpdate, UpdateCampaignInput, User,
    },
    Database,
};
use crate::error::JsonErr;
use rocket::{delete, get, http::Status, post, put, serde::json::Json};
use serde::{Deserialize, Serialize};

#[derive(Serialize)]
pub enum CampaignError {
    CampaignNotFound,
    Unauthorized,
    UnableToCreate,
    InvalidInput,
}

#[get("/<campaign_id>")]
pub async fn get(campaign_id: i32, db: Database) -> Result<Json<Campaign>, JsonErr<CampaignError>> {
    let campaign = db
        .run(move |conn| Campaign::get_from_id(conn, campaign_id))
        .await;

    match campaign {
        Some(campaign) => {
            if campaign.published {
                Ok(Json(campaign))
            } else {
                Err(JsonErr(CampaignError::Unauthorized, Status::Forbidden))
            }
        }
        None => Err(JsonErr(CampaignError::CampaignNotFound, Status::NotFound)),
    }
}

#[derive(Serialize)]
pub struct DashboardCampaignGroupings {
    pub current_campaigns: Vec<CampaignWithRoles>,
    pub past_campaigns: Vec<CampaignWithRoles>,
}

#[get("/all")]
pub async fn get_all_campaigns(user: User, db: Database) -> Json<DashboardCampaignGroupings> {
    let (current_campaigns, past_campaigns) = db
        .run(move |conn| {
            (
                Campaign::get_all_public_with_roles(conn, user.id),
                Campaign::get_all_public_ended_with_roles(conn, user.id),
            )
        })
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
) -> Result<Json<()>, JsonErr<CampaignError>> {
    db.run(move |conn| {
        OrganisationUser::campaign_admin_level(campaign_id, user.id, &conn)
            .is_at_least_director()
            .check()
            .or_else(|_| Err(JsonErr(CampaignError::Unauthorized, Status::Forbidden)))?;

        Campaign::update(conn, campaign_id, &update_campaign);

        Ok(Json(()))
    })
    .await
}

#[derive(Serialize, Deserialize)]
pub struct RoleInput {
    pub name: String,
    pub description: Option<String>,
    pub min_available: i32,
    pub max_available: i32,
    pub questions_for_role: Vec<usize>,
}

fn default_max_bytes() -> i32 {
    100
}

#[derive(Serialize, Deserialize)]
pub struct QuestionInput {
    pub title: String,
    pub common_question: bool,
    pub description: Option<String>,
    #[serde(default = "default_max_bytes")]
    pub max_bytes: i32,
    #[serde(default)]
    pub required: bool,
}

#[derive(Deserialize)]
pub struct NewCampaignWithData {
    pub campaign: NewCampaignInput,
    pub roles: Vec<RoleInput>,
    pub questions: Vec<QuestionInput>,
}

#[post("/", data = "<new_campaign>")]
pub async fn new(
    new_campaign: Json<NewCampaignWithData>,
    user: User,
    db: Database,
) -> Result<Json<Campaign>, JsonErr<CampaignError>> {
    let inner = new_campaign.into_inner();
    let NewCampaignWithData {
        campaign,
        roles,
        mut questions,
    } = inner;

    let mut new_questions: Vec<NewQuestion> = questions
        .iter_mut()
        .map(|x| NewQuestion {
            role_id: None,
            title: x.title.clone(),
            description: x.description.clone(),
            max_bytes: x.max_bytes,
            required: x.required,
        })
        .collect();

    db.run(move |conn| {
        OrganisationUser::organisation_admin_level(campaign.organisation_id, user.id, &conn)
            .is_at_least_director()
            .check()
            .or_else(|_| Err(JsonErr(CampaignError::Unauthorized, Status::Forbidden)))?;

        let campaign = Campaign::create(conn, &campaign).ok_or_else(|| {
            eprintln!("Failed to create campaign for some reason: {:?}", campaign);
            JsonErr(CampaignError::UnableToCreate, Status::InternalServerError)
        })?;

        for role in roles {
            let new_role = RoleUpdate {
                campaign_id: campaign.id,
                name: role.name,
                description: role.description,
                min_available: role.min_available,
                max_available: role.max_available,
                finalised: campaign.published,
            };
            let inserted_role = new_role.insert(conn).ok_or_else(|| {
                eprintln!("Failed to create role for some reason: {:?}", new_role);
                JsonErr(CampaignError::UnableToCreate, Status::InternalServerError)
            })?;

            for question in role.questions_for_role {
                if questions[question].common_question {
                    // If question is common
                    new_questions[question].role_id = None;
                } else if let None = new_questions[question].role_id {
                    // If question is unique and no role_id assigned to it
                    new_questions[question].role_id = Option::from(inserted_role.id);
                } else {
                    // If question is meant to be unique, but already has a role_id assigned to it
                    eprintln!("Question is not common, yet has multiple roles asking for it");
                    return Err(JsonErr(CampaignError::UnableToCreate, Status::BadRequest));
                }
            }
        }

        for question in new_questions {
            question.insert(conn).ok_or_else(|| {
                eprintln!("Failed to create question for some reason");
                JsonErr(CampaignError::UnableToCreate, Status::InternalServerError)
            })?;
        }

        Ok(Json(campaign))
    })
    .await
}

#[delete("/<campaign_id>")]
pub async fn delete_campaign(
    campaign_id: i32,
    user: User,
    db: Database,
) -> Result<Json<()>, JsonErr<CampaignError>> {
    db.run(move |conn| {
        // need to be admin to create new campaign
        OrganisationUser::campaign_admin_level(campaign_id, user.id, &conn)
            .is_admin()
            .check()
            .or_else(|_| Err(JsonErr(CampaignError::Unauthorized, Status::Forbidden)))?;

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
) -> Result<Json<RolesResponse>, JsonErr<RolesError>> {
    db.run(move |conn| {
        let campaign = Campaign::get_from_id(conn, campaign_id)
            .ok_or_else(|| JsonErr(RolesError::CampaignNotFound, Status::NotFound))?;

        OrganisationUser::campaign_admin_level(campaign_id, user.id, &conn)
            .is_at_least_director()
            .or(campaign.published) // only if not (read only and campaign is unpublished)
            .check()
            .or_else(|_| Err(JsonErr(RolesError::Unauthorized, Status::Forbidden)))?;

        let roles = Role::get_all_from_campaign_id(conn, campaign.id);

        Ok(Json(RolesResponse { roles }))
    })
    .await
}
