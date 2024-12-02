use crate::models::error::ChaosError;
use lettre::transport::smtp::authentication::Credentials;
use lettre::{
    AsyncSmtpTransport, AsyncTransport, Message, SmtpTransport, Tokio1Executor, Transport,
};
use std::env;

pub struct ChaosEmail;

#[derive(Clone)]
pub struct EmailCredentials {
    pub credentials: Credentials,
    pub email_host: String,
}

pub struct EmailParts {
    pub subject: String,
    pub body: String,
}

impl ChaosEmail {
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

    fn new_connection(
        credentials: EmailCredentials,
    ) -> Result<AsyncSmtpTransport<Tokio1Executor>, ChaosError> {
        Ok(AsyncSmtpTransport::relay(&*credentials.email_host)?
            .credentials(credentials.credentials)
            .build())
    }

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
