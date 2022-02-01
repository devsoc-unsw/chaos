use crate::database::{
    models::{
        Campaign, OrganisationDirector, Question, QuestionResponse, Role, UpdateQuestionInput, User,
    },
    Database,
};
use rocket::{
    delete,
    form::Form,
    get, put,
    serde::{json::Json, Serialize},
    FromForm,
};
use std::convert::From;

#[derive(Serialize)]
pub enum QuestionError {
    QuestionNotFound,
    UpdateFailed,
    InsufficientPermissions,
}

#[get("/<question_id>")]
pub async fn get_question(
    db: Database,
    question_id: i32,
) -> Result<Json<QuestionResponse>, Json<QuestionError>> {
    let res = db
        .run(move |conn| Question::get_from_id(&conn, question_id))
        .await;

    match res {
        Some(question) => Ok(Json(QuestionResponse::from(question))),
        None => Err(Json(QuestionError::QuestionNotFound)),
    }
}

#[put("/<question_id>", data = "<update_question>")]
pub async fn edit_question(
    db: Database,
    question_id: i32,
    update_question: Form<UpdateQuestionInput>,
    user: User,
) -> Result<(), Json<QuestionError>> {
    db.run(move |conn| {
        let question = Question::get_from_id(&conn, question_id)
            .ok_or(Json(QuestionError::QuestionNotFound))?;
        let role = Role::get_from_id(conn, question.role_id)
            .ok_or(Json(QuestionError::QuestionNotFound))?;
        OrganisationDirector::new_from_campaign_id(user, role.campaign_id, &conn)
            .map_err(|_| Json(QuestionError::InsufficientPermissions))
    })
    .await?;

    db.run(move |conn| Question::update(&conn, question_id, update_question.into_inner()))
        .await
        .ok_or(Json(QuestionError::UpdateFailed))
}

#[delete("/<question_id>")]
pub async fn delete_question(
    db: Database,
    question_id: i32,
    user: User,
) -> Result<(), Json<QuestionError>> {
    db.run(move |conn| {
        let question = Question::get_from_id(&conn, question_id)
            .ok_or(Json(QuestionError::QuestionNotFound))?;
        let role = Role::get_from_id(conn, question.role_id)
            .ok_or(Json(QuestionError::QuestionNotFound))?;
        OrganisationDirector::new_from_campaign_id(user, role.campaign_id, &conn)
            .map_err(|_| Json(QuestionError::InsufficientPermissions))
    })
    .await?;

    db.run(move |conn| {
        if Question::delete(&conn, question_id) {
            Ok(())
        } else {
            Err(Json(QuestionError::UpdateFailed))
        }
    })
    .await
}
