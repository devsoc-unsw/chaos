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

    /// Campaign period has ended
    #[error("Campagin closed")]
    CampaignClosed,

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

    // not covered by any other error
    #[error("Internal server error")]
    InternalServerError,
}

impl ChaosError {
    pub fn print(&self) {
        match &self {
            ChaosError::NotLoggedIn
            | ChaosError::Unauthorized
            | ChaosError::ForbiddenOperation
            | ChaosError::BadRequest
            | ChaosError::NotFound
            | ChaosError::ApplicationClosed
            | ChaosError::CampaignClosed
            | ChaosError::InternalServerError => println!("{:?}", self),
            ChaosError::BadRequestWithMessage(e) => println!("Bad Request: {}", e),
            ChaosError::DatabaseError(e) => println!("Database error: {}", e),
            ChaosError::MigrationError(e) => println!("Migration error: {}", e),
            ChaosError::ReqwestError(e) => println!("Reqwest error: {}", e),
            ChaosError::OAuthError(e) => println!("OAuth2 error: {}", e),
            ChaosError::StorageError(e) => println!("Storage error: {}", e),
            ChaosError::DotEnvyError(e) => println!("DotEnvy error: {}", e),
            ChaosError::TemplateError(e) => println!("Template error: {}", e),
            ChaosError::TemplateRenderError(e) => println!("TemplateRender error: {}", e),
            ChaosError::LettreError(e) => println!("Lettre error: {}", e),
            ChaosError::AddressError(e) => println!("Address error: {}", e),
            ChaosError::SmtpTransportError(e) => println!("SmtpTransport error: {}", e),
        };
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
            // We only care about the RowNotFound error, as others are miscellaneous DB errors.
            ChaosError::DatabaseError(sqlx::Error::RowNotFound) => {
                AppMessage::NotFoundMessage("Not found").into_response()
            }
            _ => AppMessage::ErrorMessage("Internal server error").into_response(),
        }
    }
}

#[cfg(test)]
mod tests {
    // =========================================================================
    // TEST PLAN – Equivalence Partitioning (EP) & Boundary Value Analysis (BVA)
    // =========================================================================
    //
    // Functions under test
    //   · <ChaosError as IntoResponse>::into_response(self) -> Response
    //
    // The contract under test is the mapping from each error class to an HTTP
    // status code. The body is deliberately generic ("don't leak real error"),
    // so only the status code is asserted.
    //
    // ── EQUIVALENCE PARTITIONING ──────────────────────────────────────────────
    //
    // into_response – error variant -> HTTP status
    //
    //  ID    Variant                             Expected status         Test
    //  EP01  NotLoggedIn                         401 UNAUTHORIZED        maps_not_logged_in_to_401
    //  EP02  Unauthorized                        403 FORBIDDEN           maps_authz_errors_to_403
    //  EP03  ForbiddenOperation                  403 FORBIDDEN           maps_authz_errors_to_403
    //  EP04  BadRequest                          400 BAD_REQUEST         maps_bad_request_family_to_400
    //  EP05  BadRequestWithMessage               400 BAD_REQUEST         maps_bad_request_family_to_400
    //  EP06  ApplicationClosed                   400 BAD_REQUEST         maps_bad_request_family_to_400
    //  EP07  CampaignClosed                      400 BAD_REQUEST         maps_bad_request_family_to_400
    //  EP08  NotFound                            404 NOT_FOUND           maps_not_found_to_404
    //  EP09  DatabaseError(RowNotFound)          404 NOT_FOUND           maps_row_not_found_to_404
    //  EP10  DatabaseError(other)                500 INTERNAL_SERVER_ERR db_error_other_than_row_not_found_is_500
    //  EP11  InternalServerError                 500 INTERNAL_SERVER_ERR falls_through_to_500
    //
    // ── BOUNDARY VALUE ANALYSIS ───────────────────────────────────────────────
    //
    // DatabaseError sub-dispatch – the single special case is RowNotFound (404);
    // every other sqlx::Error falls through to the 500 catch-all. RowNotFound vs
    // any-other-DB-error is the boundary.
    //
    //  ID    Value                        Expected   Test                                     Status
    //  BV01  DatabaseError(RowNotFound)   404        maps_row_not_found_to_404                OK
    //  BV02  DatabaseError(PoolClosed)    500        db_error_other_than_row_not_found_is_500 OK
    //
    // ── KNOWN GAPS ────────────────────────────────────────────────────────────
    //
    //  · The response BODY (generic message strings) is not asserted. If a future
    //    change accidentally leaked the underlying error text into the body, these
    //    status-only tests would not catch it. print() (stdout only) is also
    //    untested as it has no observable return contract.
    // =========================================================================

    use super::*;
    use axum::http::StatusCode;

    /// White-box: an unauthenticated error maps to 401.
    #[test]
    fn maps_not_logged_in_to_401() {
        assert_eq!(
            ChaosError::NotLoggedIn.into_response().status(),
            StatusCode::UNAUTHORIZED
        );
    }

    /// White-box: both authorisation errors map to 403 Forbidden.
    #[test]
    fn maps_authz_errors_to_403() {
        assert_eq!(
            ChaosError::Unauthorized.into_response().status(),
            StatusCode::FORBIDDEN
        );
        assert_eq!(
            ChaosError::ForbiddenOperation.into_response().status(),
            StatusCode::FORBIDDEN
        );
    }

    /// White-box: the whole bad-request family (incl. closed periods) maps to 400.
    #[test]
    fn maps_bad_request_family_to_400() {
        for err in [
            ChaosError::BadRequest,
            ChaosError::BadRequestWithMessage("x".to_string()),
            ChaosError::ApplicationClosed,
            ChaosError::CampaignClosed,
        ] {
            assert_eq!(err.into_response().status(), StatusCode::BAD_REQUEST);
        }
    }

    /// White-box: an explicit NotFound maps to 404.
    #[test]
    fn maps_not_found_to_404() {
        assert_eq!(
            ChaosError::NotFound.into_response().status(),
            StatusCode::NOT_FOUND
        );
    }

    /// White-box: the RowNotFound DB error is specially mapped to 404, not 500.
    #[test]
    fn maps_row_not_found_to_404() {
        let err = ChaosError::DatabaseError(sqlx::Error::RowNotFound);
        assert_eq!(err.into_response().status(), StatusCode::NOT_FOUND);
    }

    /// White-box: any other DB error falls through the catch-all to 500.
    #[test]
    fn db_error_other_than_row_not_found_is_500() {
        let err = ChaosError::DatabaseError(sqlx::Error::PoolClosed);
        assert_eq!(
            err.into_response().status(),
            StatusCode::INTERNAL_SERVER_ERROR
        );
    }

    /// White-box: InternalServerError hits the final `_` arm as a 500.
    #[test]
    fn falls_through_to_500() {
        assert_eq!(
            ChaosError::InternalServerError.into_response().status(),
            StatusCode::INTERNAL_SERVER_ERROR
        );
    }
}
