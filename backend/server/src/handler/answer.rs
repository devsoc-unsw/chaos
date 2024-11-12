use axum::extract::{Json, Path, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;
use serde_json::json;
use crate::models::answer::{Answer, NewAnswer};
use crate::models::app::AppState;
use crate::models::auth::{AnswerOwner, ApplicationOwner, AuthUser};
use crate::models::error::ChaosError;
use crate::models::transaction::DBTransaction;

pub struct AnswerHandler;

impl AnswerHandler {
    pub async fn create(
        State(state): State<AppState>,
        Path(path): Path<i64>,
        user: AuthUser,
        mut transaction: DBTransaction<'_>,
        Json(data): Json<NewAnswer>,
    ) -> Result<impl IntoResponse, ChaosError> {
        let id = Answer::create(
            user.user_id,
            data.application_id,
            data.question_id,
            data.answer_data,
            state.snowflake_generator,
            &mut transaction.tx
        ).await?;

        transaction.tx.commit().await?;

        Ok((StatusCode::OK, Json(json!({"id": id}))))
    }

    pub async fn get_all_common_by_application(
        Path(application_id): Path<i64>,
        _owner: ApplicationOwner,
        mut transaction: DBTransaction<'_>,
    ) -> Result<impl IntoResponse, ChaosError> {
        let answers = Answer::get_all_common_by_application(application_id, &mut transaction.tx)
            .await?;

        transaction.tx.commit().await?;

        Ok((StatusCode::OK, Json(answers)))
    }

    pub async fn get_all_by_application_and_role(
        Path((application_id, role_id)): Path<(i64, i64)>,
        _owner: ApplicationOwner,
        mut transaction: DBTransaction<'_>,
    ) -> Result<impl IntoResponse, ChaosError> {
        let answers = Answer::get_all_by_application_and_role(application_id, role_id, &mut transaction.tx)
            .await?;

        transaction.tx.commit().await?;

        Ok((StatusCode::OK, Json(answers)))
    }

    pub async fn update(
        Path(answer_id): Path<i64>,
        _owner: AnswerOwner,
        mut transaction: DBTransaction<'_>,
        Json(data): Json<NewAnswer>,
    ) -> Result<impl IntoResponse, ChaosError> {
        Answer::update(
            answer_id,
            data.answer_data,
            &mut transaction.tx
        ).await?;

        transaction.tx.commit().await?;

        Ok((StatusCode::OK, "Successfully updated answer"))
    }

    pub async fn delete(
        Path(answer_id): Path<i64>,
        _owner: AnswerOwner,
        mut transaction: DBTransaction<'_>
    ) -> Result<impl IntoResponse, ChaosError> {
        Answer::delete(answer_id, &mut transaction.tx).await?;

        transaction.tx.commit().await?;

        Ok((StatusCode::OK, "Successfully deleted answer"))
    }
}