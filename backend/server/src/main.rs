use crate::models::app::app;
use crate::models::email::EmailQueue;
use crate::models::error::ChaosError;
use crate::models::seeder::Seeder;

mod handler;
mod models;
mod service;
mod constants;

#[tokio::main]
async fn main() -> Result<(), ChaosError> {
    // Try to load .env file, but don't fail if it doesn't exist (env vars may be set via Docker)
    dotenvy::dotenv().ok();

    let super_user_email = std::env::var("CHAOS_SUPER_USER_EMAIL").expect("CHAOS_SUPER_USER_EMAIL must be set");
    let mut seeder = Seeder::init().await;
    seeder.seed_database(super_user_email).await?;

    let (app, state_clone) = app().await?;
    let email_db = state_clone.db.clone();

    let email_task = tokio::spawn(async move {
        loop {
            let mut transaction = email_db.begin().await.unwrap();
            if let Err(e) = EmailQueue::send_next(state_clone.email_credentials.clone(), &mut transaction).await
            {
                eprintln!("Error processing email: {}", e);
            } else {
                transaction.commit().await.unwrap();
            }

            // Small delay to prevent excessive CPU usage
            tokio::time::sleep(std::time::Duration::from_millis(1000)).await;
        }
    });


    let listener = tokio::net::TcpListener::bind("0.0.0.0:8000").await.unwrap();
    let server_task = axum::serve(listener, app);

    let _ = tokio::join!(server_task, email_task);

    Ok(())
}