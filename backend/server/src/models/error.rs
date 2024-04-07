use anyhow::Error;
use axum::extract::rejection::JsonRejection;
use axum::http::StatusCode;
use axum::response::{IntoResponse, Redirect, Response};

pub enum ChaosError {
    NotLoggedIn,
    Unauthorized,
    ForbiddenOperation,
    ServerError(anyhow::Error)
}

impl IntoResponse for ChaosError {
    fn into_response(self) -> Response {
        match self {
            ChaosError::NotLoggedIn => {
                Redirect::temporary("/auth/google").into_response()
            }
            ChaosError::Unauthorized => {(StatusCode::UNAUTHORIZED, "Unauthorized".to_string()).into_response()},
            ChaosError::ForbiddenOperation => {(StatusCode::FORBIDDEN, "Forbidden operation".to_string()).into_response()},
            ChaosError::ServerError(e) => {(StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response()}
        }
    }
}

impl<E> From<E> for ChaosError
where
    E: Into<anyhow::Error>,
{
    fn from(err: E) -> Self {
        ChaosError::ServerError(err.into())
    }
}
