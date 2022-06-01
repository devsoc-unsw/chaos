use crate::database::{
    models::{
        Campaign, OrganisationUser, Question, QuestionResponse, Role, UpdateQuestionInput, User,
    },
    Database,
};

use rocket::{
    delete,
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

// TODO: may be useless function, also awfully inefficient.
#[get("/<question_id>")]
pub async fn get_question(
    user: User,
    db: Database,
    question_id: i32,
) -> Result<Json<QuestionResponse>, Json<QuestionError>> {
    db.run(move |conn| {
        let q = Question::get_from_id(&conn, question_id)
            .ok_or(Json(QuestionError::QuestionNotFound))?;
        let r = Role::get_from_id(&conn, q.role_id).ok_or(Json(QuestionError::QuestionNotFound))?;
        let c = Campaign::get_from_id(&conn, r.campaign_id)
            .ok_or(Json(QuestionError::QuestionNotFound))?;
        OrganisationUser::role_admin_level(q.role_id, user.id, conn)
            .is_at_least_director()
            .or(c.published)
            .check()
            .map_err(|_| Json(QuestionError::InsufficientPermissions))?;
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
