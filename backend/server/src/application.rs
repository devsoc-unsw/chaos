use diesel::prelude::*;

use crate::{database::{
    models::{
        Answer, Application, Campaign, Comment, NewAnswer, NewApplication, NewRating,
        OrganisationUser, Question, Rating, Role, User,
    },
    schema::ApplicationStatus,
    Database,
}, question_types::AnswerData};
use crate::error::JsonErr;
use rocket::{
    get,
    http::Status,
    post, put,
    serde::{json::Json, Deserialize, Serialize},
    FromForm,
};
use crate::question_types::AnswerDataInput;

#[derive(Serialize)]
pub enum ApplicationError {
    Unauthorized,
    UserNotFound,
    RoleNotFound,
    UnableToCreate,
    UnableToUpdate,
    AppNotFound,
    QuestionNotFound,
    InvalidInput,
    CampaignEnded,
    AnswerDataNotFound,
}

#[derive(Deserialize)]
pub struct ApplicationReq {
    pub role_id: i32,
}

#[post("/", data = "<app_req>")]
pub async fn create_application(
    app_req: Json<ApplicationReq>,
    user: User,
    db: Database,
) -> Result<Json<Application>, JsonErr<ApplicationError>> {
    use crate::database::schema::applications::dsl::*;
    use diesel::prelude::*;
    use diesel::query_dsl::RunQueryDsl;

    let new_application = NewApplication {
        user_id: user.id,
        role_id: app_req.role_id,
        status: ApplicationStatus::Pending,
        private_status: ApplicationStatus::Pending,
    };

    let application = db
        .run(move |conn| {
            let role = Role::get_from_id(conn, app_req.role_id)?;
            let camp = Campaign::get_from_id(conn, role.campaign_id)?;

            if !camp.is_running() {
                return None;
            }

            let count = applications
                .filter(role_id.eq(app_req.role_id).and(user_id.eq(user.id)))
                .select(id)
                .load::<i32>(conn)
                .unwrap_or_else(|_| vec![])
                .len();

            if count > 0 {
                return None;
            }

            NewApplication::insert(&new_application, conn)
        })
        .await
        .ok_or(JsonErr(
            ApplicationError::UnableToCreate,
            Status::BadRequest,
        ))?;

    Ok(Json(application))
}

#[derive(FromForm, Deserialize)]
pub struct RatingInput {
    rating: i32,
}

#[put("/<application_id>/rating", data = "<rating>")]
pub async fn create_rating(
    application_id: i32,
    rating: Json<RatingInput>,
    user: User,
    db: Database,
) -> Result<Json<()>, JsonErr<ApplicationError>> {
    db.run(move |conn| {
        OrganisationUser::application_admin_level(application_id, user.id, &conn)
            .is_at_least_director()
            .check()
            .map_err(|_| JsonErr(ApplicationError::Unauthorized, Status::Forbidden))?;

        NewRating::insert(
            &NewRating {
                application_id,
                rater_user_id: user.id,
                rating: rating.rating,
            },
            &conn,
        )
        .ok_or(JsonErr(
            ApplicationError::UnableToCreate,
            Status::InternalServerError,
        ))?;

        Ok(Json(()))
    })
    .await
}

#[derive(Serialize, Deserialize)]
pub struct AnswerWithData {
    pub answer: NewAnswer,
    pub data: AnswerDataInput,
}


#[post("/answer", data = "<answer_with_data>")]
pub async fn submit_answer(
    user: User,
    db: Database,
    answer_with_data: Json<AnswerWithData>,
) -> Result<Json<()>, JsonErr<ApplicationError>> {
    db.run(move |conn| {
        let answer_with_data = answer_with_data.into_inner();
        let answer = answer_with_data.answer;
        let data = answer_with_data.data;

        let application = Application::get(answer.application_id, &conn)
            .ok_or(JsonErr(ApplicationError::AppNotFound, Status::NotFound))?;
        if application.user_id != user.id {
            return Err(JsonErr(ApplicationError::Unauthorized, Status::Forbidden));
        }

        let question = Question::get_from_id(&conn, answer.question_id).ok_or(JsonErr(
            ApplicationError::QuestionNotFound,
            Status::BadRequest,
        ))?;
        if answer.description.len() as i32 > question.max_bytes {
            return Err(JsonErr(ApplicationError::InvalidInput, Status::BadRequest));
        }

        let inserted_answer = NewAnswer::insert(&answer, &conn).ok_or(JsonErr(
            ApplicationError::UnableToCreate,
            Status::InternalServerError,
        ))?;


        // Insert the Answer Data UwU
        AnswerDataInput::insert_answer_data(data, conn, &inserted_answer);

        Ok(Json(()))
    })
    .await
}

#[derive(Serialize)]
pub struct AnswersResponse {
    answers: Vec<AnswerResponse>,
}

#[derive(Serialize)]
pub struct AnswerResponse {
    answer: Answer,
    data: AnswerData,
}

#[get("/<application_id>/answers")]
pub async fn get_answers(
    application_id: i32,
    user: User,
    db: Database,
) -> Result<Json<AnswersResponse>, JsonErr<ApplicationError>> {
    db.run(move |conn| {
        let app = Application::get(application_id, &conn)
            .ok_or(JsonErr(ApplicationError::AppNotFound, Status::NotFound))?;

        OrganisationUser::role_admin_level(app.role_id, user.id, &conn)
            .is_at_least_director()
            .check()
            .map_err(|_| JsonErr(ApplicationError::Unauthorized, Status::Forbidden))?;

        let mut response: Vec<AnswerResponse> = Vec::new();

        for answer in Answer::get_all_from_application_id(&conn, application_id) {
            let data = AnswerData::get_from_answer(&conn, &answer)
                .ok_or(JsonErr(ApplicationError::AnswerDataNotFound, Status::NotFound))?;
            response.push(AnswerResponse { answer: answer, data: data });
        }

        Ok(Json(AnswersResponse {
            answers: response,
        }))
    })
    .await
}

#[derive(Serialize)]
pub struct RatingsResponse {
    ratings: Vec<Rating>,
}

#[get("/<application_id>/ratings")]
pub async fn get_ratings(
    application_id: i32,
    user: User,
    db: Database,
) -> Result<Json<RatingsResponse>, JsonErr<ApplicationError>> {
    db.run(move |conn| {
        let app = Application::get(application_id, &conn)
            .ok_or(JsonErr(ApplicationError::AppNotFound, Status::NotFound))?;

        OrganisationUser::role_admin_level(app.role_id, user.id, &conn)
            .is_at_least_director()
            .check()
            .map_err(|_| JsonErr(ApplicationError::Unauthorized, Status::Forbidden))?;

        Ok(Json(RatingsResponse {
            ratings: Rating::get_all_from_application_id(conn, application_id),
        }))
    })
    .await
}

#[put("/<application_id>/status", data = "<new_status>")]
pub async fn set_status(
    application_id: i32,
    new_status: Json<ApplicationStatus>,
    user: User,
    db: Database,
) -> Result<Json<()>, JsonErr<ApplicationError>> {
    use crate::database::schema::applications::dsl::*;

    db.run(move |conn| {
        OrganisationUser::application_admin_level(application_id, user.id, &conn)
            .is_at_least_director()
            .check()
            .map_err(|_| JsonErr(ApplicationError::Unauthorized, Status::Forbidden))?;

        diesel::update(applications.filter(id.eq(application_id)))
            .set(status.eq(new_status.into_inner()))
            .execute(conn)
            .map_err(|_| {
                JsonErr(
                    ApplicationError::UnableToUpdate,
                    Status::InternalServerError,
                )
            })?;

        Ok(Json(()))
    })
    .await
}

#[put("/<application_id>/private_status", data = "<new_status>")]
pub async fn set_private_status(
    application_id: i32,
    new_status: Json<ApplicationStatus>,
    user: User,
    db: Database,
) -> Result<Json<()>, JsonErr<ApplicationError>> {
    use crate::database::schema::applications::dsl::*;

    db.run(move |conn| {
        OrganisationUser::application_admin_level(application_id, user.id, &conn)
            .is_at_least_director()
            .check()
            .map_err(|_| JsonErr(ApplicationError::Unauthorized, Status::Forbidden))?;

        diesel::update(applications.filter(id.eq(application_id)))
            .set(private_status.eq(new_status.into_inner()))
            .execute(conn)
            .map_err(|_| {
                JsonErr(
                    ApplicationError::UnableToUpdate,
                    Status::InternalServerError,
                )
            })?;

        Ok(Json(()))
    })
    .await
}

#[derive(Serialize)]
pub struct CommentsResponse {
    comments: Vec<Comment>,
}

#[get("/<application_id>/comments")]
pub async fn get_comments(
    application_id: i32,
    user: User,
    db: Database,
) -> Result<Json<CommentsResponse>, JsonErr<ApplicationError>> {
    db.run(move |conn| {
        let app = Application::get(application_id, &conn)
            .ok_or(JsonErr(ApplicationError::AppNotFound, Status::NotFound))?;

        OrganisationUser::role_admin_level(app.role_id, user.id, &conn)
            .is_at_least_director()
            .check()
            .map_err(|_| JsonErr(ApplicationError::Unauthorized, Status::Forbidden))?;

        Ok(Json(CommentsResponse {
            comments: Comment::get_all_from_application_id(conn, application_id),
        }))
    })
    .await
}
