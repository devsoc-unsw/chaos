use crate::models::app::AppState; // custom struct
use crate::models::auth::AuthUser; // manually built extractors
use axum::http::StatusCode;
use crate::service;
// use crate::service::user::{get_username, get_user};
use axum::extract::{Path, State}; // built-in extractors
use axum::Json;
use axum::response::IntoResponse; // defined traits to turn everything into a response for axum


// let everyone get a username
pub async fn get_username(
    State(state): State<AppState>, // struct that contains all the database connections / also contains random number gen -> need for all
    Path(user_id): Path<i64>, // extracts the path from the url
    _user: AuthUser // checks if people are logged in but do not need to use its value 
) -> Result<impl IntoResponse, impl IntoResponse> {
    
    // or MATCH
    match service::user::get_username(user_id, state.db).await {
        Ok(username) => Ok((StatusCode::OK, Json(username))), // returning in the form of intoresponse -> this allows the code to return it as a http response
        Err(e) => return Err((StatusCode::NOT_FOUND, e.to_string())), // otherwise return error
    }
}







