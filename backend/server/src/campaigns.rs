use crate::error::JsonErr;
use crate::{
    database::{
        models::{
            Campaign, CampaignWithRoles, NewCampaignInput, NewQuestion, OrganisationUser, Role,
            RoleUpdate, UpdateCampaignInput, User,
        },
        Database, schema::QuestionType,
    },
    images::{get_http_image_path, save_image, try_decode_data, ImageLocation},
};
use rocket::{data::Data, delete, get, http::Status, post, put, serde::json::Json};
use serde::{Deserialize, Serialize};

use uuid::Uuid;
use crate::question_types::QuestionDataInput;

#[derive(Serialize)]
pub enum CampaignError {
    CampaignNotFound,
    Unauthorized,
    UnableToCreate,
    InvalidInput,
}

#[get("/<campaign_id>")]
pub async fn get(campaign_id: i32, db: Database) -> Result<Json<Campaign>, JsonErr<CampaignError>> {
    let mut campaign = db
        .run(move |conn| Campaign::get_from_id(conn, campaign_id))
        .await;

    campaign = campaign.map(|mut campaign| {
        campaign.cover_image = campaign
            .cover_image
            .map(|logo_uuid| get_http_image_path(ImageLocation::ORGANISATIONS, &logo_uuid));
        campaign
    });

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
    fn with_http_cover_images(campaigns: Vec<CampaignWithRoles>) -> Vec<CampaignWithRoles> {
        campaigns
            .into_iter()
            .map(CampaignWithRoles::with_http_cover_image)
            .collect()
    }

    let (current_campaigns, past_campaigns) = db
        .run(move |conn| {
            (
                with_http_cover_images(Campaign::get_all_public_with_roles(conn, user.id)),
                with_http_cover_images(Campaign::get_all_public_ended_with_roles(conn, user.id)),
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
    pub question_data: QuestionDataInput,
    pub question_type: QuestionType,
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
    
    let question_data: Vec<QuestionDataInput> = questions
        .iter()
        .map(|x| {
           x.question_data.clone()
        })
        .collect();

    let mut new_questions: Vec<NewQuestion> = questions
        .iter_mut()
        .map(|x| NewQuestion {
            role_id: None,
            title: x.title.clone(),
            description: x.description.clone(),
            max_bytes: x.max_bytes,
            required: x.required,
            question_type: x.question_type,
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

        for (question, question_data) in new_questions.into_iter().zip(question_data.into_iter()) {

            // Insert question (skeleton) into database, and then insert it's data into
            // corresponding table in database.
            let inserted_id = question.insert(conn).ok_or_else(|| {
                eprintln!("Failed to create question for some reason");
                JsonErr(CampaignError::UnableToCreate, Status::InternalServerError)
            })?.id;

            question_data.insert_question_data(conn, inserted_id);
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

#[derive(Serialize)]
pub enum LogoError {
    Unauthorized,
    ImageDeletionFailure,
    ImageStoreFailure,
}

#[put("/<campaign_id>/cover_image", data = "<image>")]
pub async fn set_cover_image(
    campaign_id: i32,
    user: User,
    db: Database,
    image: Data<'_>,
) -> Result<Json<String>, JsonErr<LogoError>> {
    db.run(move |conn| {
        OrganisationUser::campaign_admin_level(campaign_id, user.id, &conn)
            .is_at_least_director()
            .check()
            .or_else(|_| Err(JsonErr(LogoError::Unauthorized, Status::Forbidden)))
    })
    .await?;

    let logo_uuid = Uuid::new_v4().as_hyphenated().to_string();

    let image = try_decode_data(image).await.or_else(|_| {
        Err(JsonErr(
            LogoError::ImageDeletionFailure,
            Status::InternalServerError,
        ))
    })?;

    save_image(image, ImageLocation::CAMPAIGNS, &logo_uuid)
        .map_err(|_| JsonErr(LogoError::ImageStoreFailure, Status::InternalServerError))?;

    let logo_uuid_clone = logo_uuid.clone();

    db.run(move |conn| Campaign::set_cover_image(&conn, campaign_id, &logo_uuid_clone))
        .await;

    Ok(Json(get_http_image_path(
        ImageLocation::CAMPAIGNS,
        &logo_uuid,
    )))
}
