use crate::database::{
    models::{
        Campaign, OrganisationUser, Question, QuestionResponse, Role, UpdateQuestionInput, User,
    },
    Database,
};
use crate::error::JsonErr;

use rocket::{
    delete, get,
    http::Status,
    put,
    serde::{json::Json, Serialize},
};

use std::convert::From;

#[derive(Serialize)]
pub enum QuestionError {
    QuestionNotFound,
    UpdateFailed,
    InsufficientPermissions,
}

// TODO: may be useless function, also awfully inefficient.
#[get("/<question_id>")]
pub async fn get_question(
    user: User,
    db: Database,
    question_id: i32,
) -> Result<Json<QuestionResponse>, JsonErr<QuestionError>> {
    db.run(move |conn| {
        let q = Question::get_from_id(&conn, question_id)
            .ok_or(JsonErr(QuestionError::QuestionNotFound, Status::NotFound))?;
        let r = Role::get_from_id(&conn, q.get_first_role())
            .ok_or(JsonErr(QuestionError::QuestionNotFound, Status::NotFound))?;
        let c = Campaign::get_from_id(&conn, r.campaign_id)
            .ok_or(JsonErr(QuestionError::QuestionNotFound, Status::NotFound))?;
        OrganisationUser::role_admin_level(q.get_first_role(), user.id, conn)
            .is_at_least_director()
            .or(c.published)
            .check()
            .map_err(|_| JsonErr(QuestionError::InsufficientPermissions, Status::Forbidden))?;
        Ok(q)
    })
    .await
    .map(|q| Json(QuestionResponse::from(q)))
}

#[put("/<question_id>", data = "<update_question>")]
pub async fn edit_question(
    db: Database,
    question_id: i32,
    update_question: Json<UpdateQuestionInput>,
    user: User,
) -> Result<(), JsonErr<QuestionError>> {
    db.run(move |conn| {
        let question = Question::get_from_id(&conn, question_id)
            .ok_or(JsonErr(QuestionError::QuestionNotFound, Status::NotFound))?;
        let role = Role::get_from_id(conn, question.get_first_role())
            .ok_or(JsonErr(QuestionError::QuestionNotFound, Status::NotFound))?;

        OrganisationUser::role_admin_level(role.id, user.id, &conn)
            .is_at_least_director()
            .check()
            .or_else(|_| {
                Err(JsonErr(
                    QuestionError::InsufficientPermissions,
                    Status::Forbidden,
                ))
            })?;

        Question::update(&conn, question_id, update_question.into_inner()).ok_or(JsonErr(
            QuestionError::UpdateFailed,
            Status::InternalServerError,
        ))
    })
    .await
}

#[delete("/<question_id>")]
pub async fn delete_question(
    db: Database,
    question_id: i32,
    user: User,
) -> Result<(), JsonErr<QuestionError>> {
    db.run(move |conn| {
        let question = Question::get_from_id(&conn, question_id)
            .ok_or(JsonErr(QuestionError::QuestionNotFound, Status::NotFound))?;
        let role = Role::get_from_id(conn, question.get_first_role())
            .ok_or(JsonErr(QuestionError::QuestionNotFound, Status::NotFound))?;

        OrganisationUser::role_admin_level(role.id, user.id, &conn)
            .is_at_least_director()
            .check()
            .or_else(|_| {
                Err(JsonErr(
                    QuestionError::InsufficientPermissions,
                    Status::Forbidden,
                ))
            })?;

        if Question::delete(&conn, question_id) {
            Ok(())
        } else {
            Err(JsonErr(
                QuestionError::UpdateFailed,
                Status::InternalServerError,
            ))
        }
    })
    .await
}
