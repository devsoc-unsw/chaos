//! HTTP request handlers for the Chaos application.
//! 
//! This module contains the HTTP request handlers that process incoming requests and return responses.
//! Each submodule corresponds to a specific domain of the application and contains handlers for
//! related endpoints:
//! 
//! - `answer`: Handles requests related to application answers
//! - `application`: Processes application-related requests
//! - `auth`: Manages authentication and authorization requests
//! - `campaign`: Handles campaign-related requests
//! - `email_template`: Processes email template requests
//! - `offer`: Handles offer-related requests
//! - `organisation`: Processes organisation-related requests
//! - `question`: Handles question-related requests
//! - `rating`: Processes rating-related requests
//! - `role`: Handles role-related requests
//! - `user`: Processes user-related requests

pub mod answer;
pub mod application;
pub mod auth;
pub mod campaign;
pub mod email_template;
pub mod offer;
pub mod organisation;
pub mod question;
pub mod rating;
pub mod role;
pub mod user;
