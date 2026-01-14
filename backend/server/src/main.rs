use crate::models::app::app;
use crate::models::error::ChaosError;
use crate::seeder::Seeder;

mod handler;
mod models;
mod seeder;
mod service;
mod constants;

#[tokio::main]
async fn main() -> Result<(), ChaosError> {
    // Try to load .env file, but don't fail if it doesn't exist (env vars may be set via Docker)
    dotenvy::dotenv().ok();

    let super_user_email = std::env::var("CHAOS_SUPER_USER_EMAIL").expect("CHAOS_SUPER_USER_EMAIL must be set");
    let seeder = Seeder::init().await;
    seeder.seed_database(super_user_email).await?;


    let app = app().await?;
    let listener = tokio::net::TcpListener::bind("0.0.0.0:8080").await.unwrap();
    axum::serve(listener, app).await.unwrap();
    eprintln!("error");

    Ok(())
}