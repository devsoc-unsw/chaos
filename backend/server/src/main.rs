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

    eprintln!("[DEBUG] Starting server...");
    eprintln!("[DEBUG] Initializing application state...");
    let app = app().await?;
    eprintln!("[DEBUG] Application state initialized");
    eprintln!("[DEBUG] Binding to 0.0.0.0:8080...");
    let listener = tokio::net::TcpListener::bind("0.0.0.0:8080").await.unwrap();
    eprintln!("[DEBUG] Bound to 0.0.0.0:8080, starting server...");
    axum::serve(listener, app).await.unwrap();
    eprintln!("[DEBUG] Server stopped (this shouldn't happen)");

    Ok(())
}