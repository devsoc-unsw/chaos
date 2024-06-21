use axum::http::StatusCode;
use axum::response::{IntoResponse, Redirect, Response};

/// Custom error enum for Chaos.
///
/// Handles all errors thrown by libraries (when `?` is used) alongside
/// specific errors for business logic.
#[derive(thiserror::Error, Debug)]
pub enum ChaosError {
    #[error("Not logged in")]
    NotLoggedInError,

    #[error("Not authorized")]
    UnauthorizedError,

    #[error("Forbidden operation")]
    ForbiddenOperationError,

    #[error("SQLx error")]
    DatabaseError(#[from] sqlx::Error),

    #[error("Reqwest error")]
    ReqwestError(#[from] reqwest::Error),

    #[error("OAuth2 error")]
    OAuthError(#[from] oauth2::RequestTokenError<oauth2::reqwest::Error<reqwest::Error>, oauth2::StandardErrorResponse<oauth2::basic::BasicErrorResponseType>>)
}

/// Implementation for converting errors into responses. Manages error code and message returned.
impl IntoResponse for ChaosError {
    fn into_response(self) -> Response {
        match self {
            ChaosError::NotLoggedInError => Redirect::temporary("/auth/google").into_response(),
            ChaosError::UnauthorizedError => (StatusCode::UNAUTHORIZED, "Unauthorized").into_response(),
            ChaosError::ForbiddenOperationError => (StatusCode::FORBIDDEN, "Forbidden operation").into_response(),
            ChaosError::DatabaseError(db_error) => match db_error {
                // We only care about the RowNotFound error, as others are miscellaneous DB errors.
                sqlx::Error::RowNotFound => (StatusCode::NOT_FOUND, "Not found").into_response(),
                _ => (StatusCode::INTERNAL_SERVER_ERROR, "Internal server error").into_response(),
            },
            _ => (StatusCode::INTERNAL_SERVER_ERROR, "Internal server error").into_response()
        }
    }
}
