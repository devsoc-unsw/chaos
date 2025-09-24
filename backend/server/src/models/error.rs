//! Error handling module for the Chaos application.
//! 
//! This module defines the core error types and their conversion to HTTP responses.
//! It provides a unified error handling system that covers both application-specific
//! errors and errors from external dependencies.

use axum::http::StatusCode;
use axum::response::{IntoResponse, Redirect, Response};

/// Custom error enum for Chaos.
///
/// Handles all errors thrown by libraries (when `?` is used) alongside
/// specific errors for business logic. Each variant represents a different
/// type of error that can occur in the application, from authentication
/// failures to database errors.
#[derive(thiserror::Error, Debug)]
pub enum ChaosError {
    /// User is not authenticated
    #[error("Not logged in")]
    NotLoggedIn,

    /// User is authenticated but not authorized for the operation
    #[error("Not authorized")]
    Unauthorized,

    /// Operation is forbidden for the current user
    #[error("Forbidden operation")]
    ForbiddenOperation,

    /// Invalid request parameters or data
    #[error("Bad request")]
    BadRequest,

    /// Application period has ended
    #[error("Application closed")]
    ApplicationClosed,

    /// Campaign period has ended
    #[error("Campagin closed")]
    CampaignClosed,

    /// Database operation failed
    #[error("SQLx error")]
    DatabaseError(#[from] sqlx::Error),

    /// HTTP request failed
    #[error("Reqwest error")]
    ReqwestError(#[from] reqwest::Error),

    /// OAuth2 authentication failed
    #[error("OAuth2 error")]
    OAuthError(
        #[from]
        oauth2::RequestTokenError<
            oauth2::reqwest::Error<reqwest::Error>,
            oauth2::StandardErrorResponse<oauth2::basic::BasicErrorResponseType>,
        >,
    ),

    /// S3 storage operation failed
    #[error("S3 error")]
    StorageError(#[from] s3::error::S3Error),

    /// Environment variable loading failed
    #[error("DotEnvy error")]
    DotEnvyError(#[from] dotenvy::Error),

    /// Template parsing failed
    #[error("Templating error")]
    TemplateError(#[from] handlebars::TemplateError),

    /// Template rendering failed
    #[error("Template rendering error")]
    TemplateRendorError(#[from] handlebars::RenderError),

    /// Email sending failed
    #[error("Lettre error")]
    LettreError(#[from] lettre::error::Error),

    /// Invalid email address
    #[error("Email address error")]
    AddressError(#[from] lettre::address::AddressError),

    /// SMTP transport failed
    #[error("SMTP transport error")]
    SmtpTransportError(#[from] lettre::transport::smtp::Error),
}

/// Implementation for converting errors into HTTP responses.
/// 
/// This implementation maps each error type to an appropriate HTTP status code
/// and response format. It handles both application-specific errors and
/// errors from external dependencies.
impl IntoResponse for ChaosError {
    fn into_response(self) -> Response {
        println!("Error: {:?}", self);
        match self {
            ChaosError::NotLoggedIn => Redirect::temporary("/auth/google").into_response(),
            ChaosError::Unauthorized => (StatusCode::UNAUTHORIZED, "Unauthorized").into_response(),
            ChaosError::ForbiddenOperation => {
                (StatusCode::FORBIDDEN, "Forbidden operation").into_response()
            }
            ChaosError::BadRequest => (StatusCode::BAD_REQUEST, "Bad request").into_response(),
            ChaosError::ApplicationClosed => (StatusCode::BAD_REQUEST, "Application closed").into_response(),
            ChaosError::CampaignClosed => (StatusCode::BAD_REQUEST, "Campaign closed").into_response(),
            ChaosError::DatabaseError(db_error) => match db_error {
                // We only care about the RowNotFound error, as others are miscellaneous DB errors.
                sqlx::Error::RowNotFound => (StatusCode::NOT_FOUND, "Not found").into_response(),
                _ => (StatusCode::INTERNAL_SERVER_ERROR, "Internal server error").into_response(),
            },
            _ => (StatusCode::INTERNAL_SERVER_ERROR, "Internal server error").into_response(),
        }
    }
}
