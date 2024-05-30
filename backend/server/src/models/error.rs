use axum::http::StatusCode;
use axum::response::{IntoResponse, Redirect, Response};

/// Custom error enum for Chaos.
///
/// Handles all anyhow errors (when `?` is used) alongside
/// specific errors for business logic.
pub enum ChaosError {
    NotLoggedIn,
    Unauthorized,
    ForbiddenOperation,
    ServerError(anyhow::Error),
}

impl IntoResponse for ChaosError {
    fn into_response(self) -> Response {
        match self {
            ChaosError::NotLoggedIn => Redirect::temporary("/auth/google").into_response(),
            ChaosError::Unauthorized => (StatusCode::UNAUTHORIZED, "Unauthorized").into_response(),
            ChaosError::ForbiddenOperation => {
                (StatusCode::FORBIDDEN, "Forbidden operation").into_response()
            }
            ChaosError::ServerError(e) => {
                (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()).into_response()
            }
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
