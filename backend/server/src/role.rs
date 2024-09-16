use crate::{database::{
    models::{
        Application, Campaign, GetQuestionsResponse, OrganisationUser, Question, Role, RoleUpdate,
        User,
    },
    schema::ApplicationStatus,
    Database,
}, question_types::QuestionData};
use chrono::NaiveDateTime;
use diesel::PgConnection;
use rocket::{
    delete, get, post, put,
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

#[post("/", data = "<role>")]
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
    QuestionDataNotFound,
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

        let mut questions_with_data = Vec::new();
        
        for question in Question::get_all_from_role_id(conn, role_id) {
            let data = QuestionData::get_from_question_id(conn, question.id);
            if let None = data { return Err(Json(QuestionsError::QuestionDataNotFound)); }
            questions_with_data.push((question, data.unwrap()));
        }
        Ok(Json(GetQuestionsResponse {
            questions: questions_with_data
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
    pub private_status: ApplicationStatus,
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
            private_status: app.private_status,
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
