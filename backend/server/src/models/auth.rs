//! Authentication module for the Chaos application.
//!
//! This module provides data structures used by the authentication handlers,
//! including OAuth integration with Google.

use serde::{Deserialize, Serialize};

/// Request structure for login.
///
/// Contains the redirect URL for the login page.
#[derive(Deserialize)]
pub struct LoginRequest {
    pub to: Option<String>,
}

/// Request structure for OAuth authentication.
///
/// Contains the authorization code received from the OAuth provider.
#[derive(Deserialize, Serialize)]
pub struct AuthRequest {
    /// Authorization code from the OAuth provider
    pub code: String,

    /// Redirect URL (Optional)
    pub state: Option<String>,
}

/// User profile information received from Google OAuth.
///
/// Contains basic user information provided by Google after successful authentication.
#[derive(Deserialize, Serialize)]
pub struct GoogleUserProfile {
    /// User's full name
    pub name: String,
    /// User's email address
    pub email: String,
}
