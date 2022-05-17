use crate::database::{
    models::{OrganisationUser, Question, QuestionResponse, Role, UpdateQuestionInput, User},
    Database,
};

use rocket::{
    delete,
    form::Form,
    get, put,
    serde::{json::Json, Serialize},
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
    db.run(move |conn| Question::get_from_id(&conn, question_id))
        .await
        .ok_or(Json(QuestionError::QuestionNotFound))
        .map(|q| Json(QuestionResponse::from(q)))
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

        OrganisationUser::role_admin_level(role.id, user.id, &conn)
            .is_at_least_director()
            .check()
            .or_else(|_| Err(Json(QuestionError::InsufficientPermissions)))?;

        Question::update(&conn, question_id, update_question.into_inner())
            .ok_or(Json(QuestionError::UpdateFailed))
    })
    .await
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

        OrganisationUser::role_admin_level(role.id, user.id, &conn)
            .is_at_least_director()
            .check()
            .or_else(|_| Err(Json(QuestionError::InsufficientPermissions)))?;

        if Question::delete(&conn, question_id) {
            Ok(())
        } else {
            Err(Json(QuestionError::UpdateFailed))
        }
    })
    .await
}
