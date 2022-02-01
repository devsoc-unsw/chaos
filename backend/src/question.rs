use crate::database::{
    models::{Campaign, OrganisationUser, Question, Role, User, QuestionResponse, UpdateQuestionInput},
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

#[put("/<question_id>" , data = "<update_question>")]
pub async fn edit_question(db: Database, question_id: i32, update_question: Form<UpdateQuestionInput>) -> Result<(), Json<QuestionError>> {
    db
        .run(move |conn| Question::update(&conn, question_id, update_question.into_inner()))
        .await
        .ok_or(Json(QuestionError::UpdateFailed))
}
