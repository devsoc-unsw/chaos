use axum::http::StatusCode;
use axum::response::{IntoResponse, Redirect, Response};

/// Custom error enum for Chaos.
///
/// Handles all errors thrown by libraries (when `?` is used) alongside
/// specific errors for business logic.
#[derive(thiserror::Error, Debug)]
pub enum ChaosError {
    #[error("Not logged in")]
    NotLoggedIn,

    #[error("Not authorized")]
    Unauthorized,

    #[error("Forbidden operation")]
    ForbiddenOperation,

    #[error("Bad request")]
    BadRequest,

    #[error("SQLx error")]
    DatabaseError(#[from] sqlx::Error),

    #[error("Reqwest error")]
    ReqwestError(#[from] reqwest::Error),

    #[error("OAuth2 error")]
    OAuthError(
        #[from]
        oauth2::RequestTokenError<
            oauth2::reqwest::Error<reqwest::Error>,
            oauth2::StandardErrorResponse<oauth2::basic::BasicErrorResponseType>,
        >,
    ),

    #[error("S3 error")]
    StorageError(#[from] s3::error::S3Error),
}

/// Implementation for converting errors into responses. Manages error code and message returned.
impl IntoResponse for ChaosError {
    fn into_response(self) -> Response {
        match self {
            ChaosError::NotLoggedIn => Redirect::temporary("/auth/google").into_response(),
            ChaosError::Unauthorized => (StatusCode::UNAUTHORIZED, "Unauthorized").into_response(),
            ChaosError::ForbiddenOperation => {
                (StatusCode::FORBIDDEN, "Forbidden operation").into_response()
            }
            ChaosError::BadRequest => (StatusCode::BAD_REQUEST, "Bad request").into_response(),
            ChaosError::DatabaseError(db_error) => match db_error {
                // We only care about the RowNotFound error, as others are miscellaneous DB errors.
                sqlx::Error::RowNotFound => (StatusCode::NOT_FOUND, "Not found").into_response(),
                _ => (StatusCode::INTERNAL_SERVER_ERROR, "Internal server error").into_response(),
            },
            _ => (StatusCode::INTERNAL_SERVER_ERROR, "Internal server error").into_response(),
        }
    }
}
