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
    /// Returns a stable diagnostic category without exposing error payloads.
    pub fn kind(&self) -> &'static str {
        match self {
            Self::NotLoggedIn => "not_logged_in",
            Self::Unauthorized => "unauthorized",
            Self::ForbiddenOperation => "forbidden_operation",
            Self::BadRequest | Self::BadRequestWithMessage(_) => "bad_request",
            Self::NotFound => "not_found",
            Self::ApplicationClosed => "application_closed",
            Self::CampaignClosed => "campaign_closed",
            Self::CampaignOpen => "campaign_open",
            Self::DatabaseError(_) => "database_error",
            Self::MigrationError(_) => "migration_error",
            Self::ReqwestError(_) => "http_client_error",
            Self::OAuthError(_) => "oauth_error",
            Self::StorageError(_) => "storage_error",
            Self::DotEnvyError(_) => "environment_error",
            Self::TemplateError(_) => "template_error",
            Self::TemplateRenderError(_) => "template_render_error",
            Self::LettreError(_) => "email_error",
            Self::AddressError(_) => "email_address_error",
            Self::SmtpTransportError(_) => "smtp_error",
            Self::InternalServerError | Self::InternalServerErrorWithMessage(_) => {
                "internal_server_error"
            }
        }
    }

    /// Records an error as structured telemetry without dumping request data.
    pub fn print(&self) {
        match self {
            Self::NotLoggedIn
            | Self::Unauthorized
            | Self::ForbiddenOperation
            | Self::BadRequest
            | Self::BadRequestWithMessage(_)
            | Self::NotFound
            | Self::ApplicationClosed
            | Self::CampaignClosed
            | Self::CampaignOpen => {
                tracing::warn!(error_kind = self.kind(), "Request rejected");
            }
            _ => tracing::error!(error_kind = self.kind(), "Backend operation failed"),
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
