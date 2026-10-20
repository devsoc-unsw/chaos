//! Error handling module for the Chaos application.
//!
//! This module defines the core error types and their conversion to HTTP responses.
//! It provides a unified error handling system that covers both application-specific
//! errors and errors from external dependencies.

use crate::models::app::AppMessage;
use axum::response::{IntoResponse, Response};

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

    /// Invalid request parameters or data with detailed message
    #[error("Bad request: {0}")]
    BadRequestWithMessage(String),

    /// Resource not found
    #[error("Not found")]
    NotFound,

    /// Application period has ended
    #[error("Application closed")]
    ApplicationClosed,

    /// Campaign period has ended or not started
    #[error("Campaign closed")]
    CampaignClosed,

    /// Campaign is published
    #[error("Campaign open")]
    CampaignOpen,

    /// Database operation failed
    #[error("SQLx error")]
    DatabaseError(#[from] sqlx::Error),

    #[error("Migration error")]
    MigrationError(#[from] sqlx::migrate::MigrateError),

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
    TemplateRenderError(#[from] handlebars::RenderError),

    /// Email sending failed
    #[error("Lettre error")]
    LettreError(#[from] lettre::error::Error),

    /// Invalid email address
    #[error("Email address error")]
    AddressError(#[from] lettre::address::AddressError),

    /// SMTP transport failed
    #[error("SMTP transport error")]
    SmtpTransportError(#[from] lettre::transport::smtp::Error),

    /// Internal server error with detailed message
    #[error("Internal server error: {0}")]
    InternalServerErrorWithMessage(String),

    // not covered by any other error
    #[error("Internal server error")]
    InternalServerError,
}

impl ChaosError {
    /// Records the original error details through structured telemetry.
    /// Payloads are included in local logs and configured remote log exports.
    pub fn print(&self) {
        match self {
            Self::NotLoggedIn
            | Self::Unauthorized
            | Self::ForbiddenOperation
            | Self::BadRequest
            | Self::NotFound
            | Self::ApplicationClosed
            | Self::CampaignClosed
            | Self::CampaignOpen => {
                tracing::warn!(error = ?self, "Request rejected");
            }
            Self::InternalServerError => {
                tracing::error!(error = ?self, "Backend operation failed");
            }
            Self::BadRequestWithMessage(error) => {
                tracing::warn!(%error, "Bad request");
            }
            Self::InternalServerErrorWithMessage(error) => {
                tracing::error!(%error, "Internal server error");
            }
            Self::DatabaseError(error) => tracing::error!(%error, "Database error"),
            Self::MigrationError(error) => tracing::error!(%error, "Migration error"),
            Self::ReqwestError(error) => tracing::error!(%error, "Reqwest error"),
            Self::OAuthError(error) => tracing::error!(%error, "OAuth2 error"),
            Self::StorageError(error) => tracing::error!(%error, "Storage error"),
            Self::DotEnvyError(error) => tracing::error!(%error, "DotEnvy error"),
            Self::TemplateError(error) => tracing::error!(%error, "Template error"),
            Self::TemplateRenderError(error) => {
                tracing::error!(%error, "Template render error");
            }
            Self::LettreError(error) => tracing::error!(%error, "Lettre error"),
            Self::AddressError(error) => tracing::error!(%error, "Address error"),
            Self::SmtpTransportError(error) => tracing::error!(%error, "SMTP transport error"),
        }
    }
}

/// Implementation for converting errors into HTTP responses.
///
/// This implementation maps each error type to an appropriate HTTP status code
/// and response format. It handles both application-specific errors and
/// errors from external dependencies.
impl IntoResponse for ChaosError {
    fn into_response(self) -> Response {
        self.print();

        // Don't leak real error, only return a generic error message
        match self {
            ChaosError::NotLoggedIn => {
                AppMessage::NotLoggedInMessage("Not logged in").into_response()
            } // User is not logged in
            ChaosError::Unauthorized => {
                AppMessage::UnauthorizedMessage("Unauthorized").into_response()
            } // Unauthorized to complete the action
            ChaosError::ForbiddenOperation => {
                AppMessage::UnauthorizedMessage("Forbidden operation").into_response()
            }
            ChaosError::BadRequest => AppMessage::BadRequestMessage("Bad request").into_response(),
            ChaosError::BadRequestWithMessage(msg) => {
                AppMessage::BadRequestMessage(msg).into_response()
            }
            ChaosError::NotFound => AppMessage::NotFoundMessage("Not found").into_response(),
            ChaosError::ApplicationClosed => {
                AppMessage::BadRequestMessage("Application closed").into_response()
            }
            ChaosError::CampaignClosed => {
                AppMessage::BadRequestMessage("Campaign closed").into_response()
            }
            ChaosError::CampaignOpen => {
                AppMessage::BadRequestMessage("Campaign open").into_response()
            }
            // We only care about the RowNotFound error, as others are miscellaneous DB errors.
            ChaosError::DatabaseError(e) => match e {
                sqlx::Error::RowNotFound => {
                    AppMessage::NotFoundMessage("Not found").into_response()
                }
                sqlx::Error::Database(_) => {
                    AppMessage::BadRequestMessage("Bad request").into_response()
                }
                _ => AppMessage::ErrorMessage("Internal server error").into_response(),
            },
            _ => AppMessage::ErrorMessage("Internal server error").into_response(),
        }
    }
}
