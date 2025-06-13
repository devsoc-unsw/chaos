use crate::models::app::AppState;
use crate::models::auth::EmailTemplateAdmin;
use crate::models::email_template::EmailTemplate;
use crate::models::error::ChaosError;
use crate::models::transaction::DBTransaction;
use axum::extract::{Json, Path, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;

pub struct EmailTemplateHandler;
impl EmailTemplateHandler {
    pub async fn get(
        mut transaction: DBTransaction<'_>,
        Path(id): Path<i64>,
        _user: EmailTemplateAdmin,
    ) -> Result<impl IntoResponse, ChaosError> {
        let email_template = EmailTemplate::get(id, &mut transaction.tx).await?;

        Ok((StatusCode::OK, Json(email_template)))
    }

    pub async fn update(
        _user: EmailTemplateAdmin,
        Path(id): Path<i64>,
        State(state): State<AppState>,
        Json(request_body): Json<EmailTemplate>,
    ) -> Result<impl IntoResponse, ChaosError> {
        EmailTemplate::update(
            id,
            request_body.name,
            request_body.template_subject,
            request_body.template_body,
            &state.db,
        )
        .await?;

        Ok((StatusCode::OK, "Successfully updated email template"))
    }

    pub async fn delete(
        _user: EmailTemplateAdmin,
        Path(id): Path<i64>,
        State(state): State<AppState>,
    ) -> Result<impl IntoResponse, ChaosError> {
        EmailTemplate::delete(id, &state.db).await?;

        Ok((StatusCode::OK, "Successfully delete email template"))
    }
}
