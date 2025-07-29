//! Email functionality for Chaos.
//! 
//! This module provides functionality for sending emails using SMTP.
//! It handles email credentials management and message sending through
//! the Lettre email library.

use crate::models::error::ChaosError;
use lettre::transport::smtp::authentication::Credentials;
use lettre::{AsyncSmtpTransport, AsyncTransport, Message, Tokio1Executor};
use serde::Serialize;
use std::env;

/// Main email service for Chaos.
/// 
/// This struct provides methods for setting up email credentials and
/// sending emails through SMTP.
pub struct ChaosEmail;

/// Email credentials and configuration.
/// 
/// This struct holds the SMTP credentials and host information needed
/// to establish email connections.
#[derive(Clone)]
pub struct EmailCredentials {
    /// SMTP authentication credentials
    pub credentials: Credentials,
    /// SMTP server host address
    pub email_host: String,
}

/// Components of an email message.
/// 
/// This struct represents the subject and body of an email message,
/// which can be serialized to JSON.
#[derive(Serialize)]
pub struct EmailParts {
    /// The email subject line
    pub subject: String,
    /// The email body content
    pub body: String,
}

impl ChaosEmail {
    /// Sets up email credentials from environment variables.
    /// 
    /// # Environment Variables
    /// * `SMTP_USERNAME` - The SMTP username
    /// * `SMTP_PASSWORD` - The SMTP password
    /// * `SMTP_HOST` - The SMTP server host
    /// 
    /// # Returns
    /// Returns an `EmailCredentials` instance with the configured credentials.
    /// 
    /// # Panics
    /// Panics if any of the required environment variables are not set.
    pub fn setup_credentials() -> EmailCredentials {
        let smtp_username = env::var("SMTP_USERNAME")
            .expect("Error getting SMTP USERNAME")
            .to_string();

        let smtp_password = env::var("SMTP_PASSWORD")
            .expect("Error getting SMTP PASSWORD")
            .to_string();

        let email_host = env::var("SMTP_HOST")
            .expect("Error getting SMTP HOST")
            .to_string();

        EmailCredentials {
            credentials: Credentials::new(smtp_username, smtp_password),
            email_host,
        }
    }

    /// Creates a new SMTP connection with the provided credentials.
    /// 
    /// # Arguments
    /// * `credentials` - The email credentials to use for the connection
    /// 
    /// # Returns
    /// Returns a `Result` containing either:
    /// * `Ok(AsyncSmtpTransport)` - A configured SMTP transport
    /// * `Err(ChaosError)` - An error if connection setup fails
    fn new_connection(
        credentials: EmailCredentials,
    ) -> Result<AsyncSmtpTransport<Tokio1Executor>, ChaosError> {
        Ok(
            AsyncSmtpTransport::<Tokio1Executor>::relay(&credentials.email_host)?
                .credentials(credentials.credentials)
                .build(),
        )
    }

    /// Sends an email message.
    /// 
    /// # Arguments
    /// * `recipient_name` - The name of the email recipient
    /// * `recipient_email_address` - The email address of the recipient
    /// * `subject` - The email subject
    /// * `body` - The email body content
    /// * `credentials` - The email credentials to use for sending
    /// 
    /// # Returns
    /// Returns a `Result` containing either:
    /// * `Ok(())` - If the email was sent successfully
    /// * `Err(ChaosError)` - An error if sending fails
    pub async fn send_message(
        recipient_name: String,
        recipient_email_address: String,
        subject: String,
        body: String,
        credentials: EmailCredentials,
    ) -> Result<(), ChaosError> {
        let message = Message::builder()
            .from("Chaos Subcommittee Recruitment <noreply@chaos.devsoc.app>".parse()?)
            .reply_to("help@chaos.devsoc.app".parse()?)
            .to(format!("{recipient_name} <{recipient_email_address}>").parse()?)
            .subject(subject)
            .body(body)?;

        let mailer = Self::new_connection(credentials)?;
        mailer.send(message).await?;

        Ok(())
    }
}
