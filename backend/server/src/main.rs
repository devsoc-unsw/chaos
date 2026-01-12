use crate::models::app::app;
use crate::models::error::ChaosError;

mod handler;
mod models;
mod service;
pub(crate) mod constants;

#[tokio::main]
async fn main() -> Result<(), ChaosError> {
    // Try to load .env file, but don't fail if it doesn't exist (env vars may be set via Docker)
    dotenvy::dotenv().ok();

    let app = app().await?;
    let listener = tokio::net::TcpListener::bind("0.0.0.0:8080").await.unwrap();
    axum::serve(listener, app).await.unwrap();
    eprintln!("error");

    Ok(())
}