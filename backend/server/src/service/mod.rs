//! Service layer for the Chaos application.
//! 
//! This module contains the business logic layer of the application, handling all core functionality
//! and database operations. Each submodule represents a specific domain of the application:
//! 
//! - `answer`: Manages application answers and their data
//! - `application`: Handles application creation, updates, and retrieval
//! - `auth`: Manages authentication and authorization
//! - `campaign`: Handles campaign-related operations
//! - `email_template`: Manages email template operations
//! - `jwt`: Handles JWT token generation and validation
//! - `oauth2`: Manages OAuth2 authentication flow
//! - `offer`: Handles offer creation and management
//! - `organisation`: Manages organisation-related operations
//! - `question`: Handles question management for applications
//! - `rating`: Manages application ratings
//! - `role`: Handles role management within campaigns

pub mod answer;
pub mod application;
pub mod auth;
pub mod campaign;
pub mod email_template;
pub mod jwt;
pub mod oauth2;
pub mod offer;
pub mod organisation;
pub mod question;
pub mod rating;
pub mod role;
