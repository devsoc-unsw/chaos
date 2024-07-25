use crate::models::app::AppState;
use crate::models::auth::AuthUser;
use crate::models::error::ChaosError;
use crate::{models, service};
use axum::debug_handler;
use axum::extract::{Json, Path, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;


pub struct UserHandler;

impl UserHandler {
    pub async fn get_user(
        State(state): State<AppState>,
        Path(user_id): Path<i64>,
        _user: AuthUser,
    ) -> Result<impl IntoResponse, ChaosError> {
        let user = service::user::get_user(user_id, state.db).await?;
        Ok((StatusCode::OK, Json(user)))
    }
    
    pub async fn update_user_name(
        State(state): State<AppState>,
        Path(user_id): Path<i64>,
        _user: AuthUser,
        Json(request_body): Json<models::user::UserName>,
    ) -> Result<impl IntoResponse, ChaosError> {
        service::user::update_user_name(user_id, request_body.name, state.db).await?;
    
        Ok((StatusCode::OK, "Updated username"))
    }
    
    pub async fn update_user_zid(
        State(state): State<AppState>,
        Path(user_id): Path<i64>,
        _user: AuthUser,
        Json(request_body): Json<models::user::UserZid>,
    ) -> Result<impl IntoResponse, ChaosError> {
        service::user::update_user_zid(user_id, request_body.zid, state.db).await?;
    
        Ok((StatusCode::OK, "Updated zid"))
    }
    
    pub async fn update_user_degree(
        State(state): State<AppState>,
        Path(user_id): Path<i64>,
        _user: AuthUser,
        Json(request_body): Json<models::user::UserDegree>,
    ) -> Result<impl IntoResponse, ChaosError> {
        let db_pool = state.db.clone();
        service::user::update_user_degree_name(user_id, request_body.degree_name, db_pool.clone())
            .await?;
        service::user::update_user_degree_starting_year(
            user_id,
            request_body.degree_starting_year,
            db_pool,
        )
        .await?;
    
        Ok((StatusCode::OK, "Updated user degree"))
    }
}


