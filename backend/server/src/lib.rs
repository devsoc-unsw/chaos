#[macro_use]
extern crate diesel;

#[macro_use]
extern crate diesel_migrations;

pub mod admin;
pub mod application;
pub mod auth;
pub mod campaigns;
pub mod comment;
pub mod cors;
pub mod database;
pub mod error;
pub mod guard;
pub mod images;
pub mod organisation;
pub mod permissions;
pub mod question;
pub mod role;
pub mod rocket;
pub mod state;
pub mod static_resources;
pub mod user;
