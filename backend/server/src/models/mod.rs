//! Core data models for the Chaos application.
//! 
//! This module contains all the data structures and types that represent the core entities
//! in the Chaos system. Each submodule represents a distinct domain model with its associated
//! functionality.
//! 
//! The models are designed to be used with the application's database layer and API endpoints,
//! providing a consistent interface for data manipulation and validation.

pub mod answer;
pub mod app;
pub mod application;
pub mod auth;
pub mod campaign;
pub mod serde_string;
pub mod email;
pub mod email_template;
pub mod error;
pub mod offer;
pub mod organisation;
pub mod question;
pub mod rating;
pub mod role;
pub mod storage;
pub mod transaction;
pub mod user;
