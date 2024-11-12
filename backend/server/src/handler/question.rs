use axum::extract::{Json, Path, State};
use axum::response::IntoResponse;
use axum::http::StatusCode;
use serde_json::json;
use crate::models::app::AppState;
use crate::models::auth::{AuthUser, CampaignAdmin, QuestionAdmin};
use crate::models::error::ChaosError;
use crate::models::question::{NewQuestion, Question};
use crate::models::transaction::DBTransaction;

pub struct QuestionHandler;

impl QuestionHandler {
    pub async fn create(
        State(state): State<AppState>,
        Path(campaign_id): Path<i64>,
        _admin: CampaignAdmin,
        mut transaction: DBTransaction<'_>,
        Json(data): Json<NewQuestion>,
    ) -> Result<impl IntoResponse, ChaosError> {
        let id = Question::create(
            campaign_id,
            data.title,
            data.description,
            data.common,
            data.roles,
            data.required,
            data.question_data,
            state.snowflake_generator,
            &mut transaction.tx,
        ).await?;

        transaction.tx.commit().await?;

        Ok((StatusCode::OK, Json(json!({"id": id}))))
    }

    pub async fn get_all_by_campaign_and_role(
        Path((campaign_id, role_id)): Path<(i64, i64)>,
        _user: AuthUser,
        mut transaction: DBTransaction<'_>,
    ) -> Result<impl IntoResponse, ChaosError> {
        let questions = Question::get_all_by_campaign_and_role(
            campaign_id, role_id, &mut transaction.tx
        ).await?;

        transaction.tx.commit().await?;

        Ok((StatusCode::OK, Json(questions)))
    }

    pub async fn get_all_common_by_campaign(
        Path(campaign_id): Path<i64>,
        _user: AuthUser,
        mut transaction: DBTransaction<'_>,
    ) -> Result<impl IntoResponse, ChaosError> {
        let questions = Question::get_all_common_by_campaign(
            campaign_id, &mut transaction.tx,
        ).await?;

        transaction.tx.commit().await?;

        Ok((StatusCode::OK, Json(questions)))
    }

    pub async fn update(
        State(state): State<AppState>,
        Path(question_id): Path<i64>,
        _admin: QuestionAdmin,
        mut transaction: DBTransaction<'_>,
        Json(data): Json<NewQuestion>,
    ) -> Result<impl IntoResponse, ChaosError> {
        Question::update(
            question_id, data.title, data.description, data.common,
            data.roles, data.required, data.question_data,
            &mut transaction.tx, state.snowflake_generator,
        ).await?;

        transaction.tx.commit().await?;

        Ok((StatusCode::OK, "Successfully updated question"))
    }

    pub async fn delete(
        Path(question_id): Path<i64>,
        _admin: QuestionAdmin,
        mut transaction: DBTransaction<'_>,
    ) -> Result<impl IntoResponse, ChaosError> {
        Question::delete(
            question_id,
            &mut transaction.tx,
        ).await?;

        transaction.tx.commit().await?;

        Ok((StatusCode::OK, "Successfully deleted question"))
    }
}