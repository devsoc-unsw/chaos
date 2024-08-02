use crate::models::app::AppState;
use crate::models::auth::AuthUser;
use crate::models::error::ChaosError;
use crate::{models, service};
use axum::debug_handler;
use axum::extract::{Json, Path, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;
use crate::models::user::User;

pub struct UserHandler;

impl UserHandler {
    pub async fn get(
        State(state): State<AppState>,
        user: AuthUser,
    ) -> Result<impl IntoResponse, ChaosError> {
        let user = User::get(user.user_id, &state.db).await?;
        Ok((StatusCode::OK, Json(user)))
    }
    
    pub async fn update_name(
        State(state): State<AppState>,
        user: AuthUser,
        Json(request_body): Json<models::user::UserName>,
    ) -> Result<impl IntoResponse, ChaosError> {
        User::update_name(user.user_id, request_body.name, &state.db).await?;
    
        Ok((StatusCode::OK, "Updated username"))
    }

    pub async fn update_pronouns(
        State(state): State<AppState>,
        user: AuthUser,
        Json(request_body): Json<models::user::UserPronouns>,
    ) -> Result<impl IntoResponse, ChaosError> {
        User::update_pronouns(user.user_id, request_body.pronouns, &state.db).await?;

        Ok((axum::http::StatusCode, "Updated pronouns"))
    }

    pub async fn update_gender(
        State(state): State<AppState>,
        user: AuthUser,
        Json(request_body): Json<models::user::UserGender>,
    ) -> Result<impl IntoResponse, ChaosError> {
        User::update_gender(user.user_id, request_body.gender, &state.db).await?;

        Ok((axum::http::StatusCode, "Updated gender"))
    }
    
    pub async fn update_zid(
        State(state): State<AppState>,
        user: AuthUser,
        Json(request_body): Json<models::user::UserZid>,
    ) -> Result<impl IntoResponse, ChaosError> {
        User::update_zid(user.user_id, request_body.zid, &state.db).await?;
    
        Ok((StatusCode::OK, "Updated zid"))
    }
    
    pub async fn update_degree(
        State(state): State<AppState>,
        user: AuthUser,
        Json(request_body): Json<models::user::UserDegree>,
    ) -> Result<impl IntoResponse, ChaosError> {
        //TODO: WHy is this separate?
        User::update_degree(
            user.user_id,
            request_body.degree_name,
            request_body.degree_starting_year,
            &state.db
        )
        .await?;
    
        Ok((StatusCode::OK, "Updated user degree"))
    }
}


