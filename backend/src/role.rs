use crate::database::{
    models::{Campaign, OrganisationUser, Question, Role, User},
    schema::AdminLevel,
    Database,
};

use serde::Serialize;

use rocket::{get, serde::json::Json};

#[derive(Serialize)]
pub struct QuestionIdsResponse {
    questions: Vec<i32>,
}

#[derive(Serialize)]
pub enum QuestionsError {
    RoleNotFound,
    CampaignNotFound,
    Unauthorized,
}

#[get("/<role_id>/questions")]
pub async fn get_question_ids(
    role_id: i32,
    user: User,
    db: Database,
) -> Result<Json<QuestionIdsResponse>, Json<QuestionsError>> {
    let role = db
        .run(move |conn| Role::get_from_id(conn, role_id))
        .await
        .ok_or(QuestionsError::RoleNotFound)?;

    let campaign = db
        .run(move |conn| Campaign::get_from_id(conn, role.campaign_id))
        .await
        .ok_or(QuestionsError::CampaignNotFound)?;

    let org_user = db
        .run(move |conn| OrganisationUser::get(conn, campaign.organisation_id, user.id))
        .await
        .ok_or(QuestionsError::Unauthorized)?;

    // Prevent people from viewing while it's in draft mode,
    // unless they have adequate permissions
    if campaign.draft && !user.superuser && org_user.admin_level == AdminLevel::ReadOnly {
        return Err(Json(QuestionsError::Unauthorized));
    }

    Ok(Json(QuestionIdsResponse {
        questions: db
            .run(move |conn| Question::get_ids_from_role_id(conn, role_id))
            .await,
    }))
}
