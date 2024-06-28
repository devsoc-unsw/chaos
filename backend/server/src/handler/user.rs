use crate::models::app::AppState;
use crate::models::auth::AuthUser;
use axum::http::StatusCode;
use crate::{models, service};
use axum::extract::{Path, State, Json};
use axum::response::IntoResponse;

pub async fn get_user(
    State(state): State<AppState>,
    Path(user_id): Path<i64>,
    _user: AuthUser,
) -> Result<impl IntoResponse, impl IntoResponse> {
    match service::user::get_user(user_id, state.db).await {
        Ok(user) => Ok((StatusCode::OK, Json(user))),
        Err(e) => return Err((StatusCode::NOT_FOUND, e.to_string())),
    }
}

pub async fn update_user_name(
    State(state): State<AppState>,
    Path(user_id): Path<i64>,
    _user: AuthUser,
    Json(request_body): Json<models::user::UserName>
) -> Result<impl IntoResponse, impl IntoResponse> {

    match service::user::update_user_name(user_id, request_body.name, state.db).await {
        Ok(message) => Ok((StatusCode::OK, Json(message))),
        Err(e) => return Err((StatusCode::NOT_FOUND, e.to_string())),
    }
}