use crate::models::app::app;
use crate::models::error::ChaosError;

mod handler;
mod models;
mod service;

#[tokio::main]
async fn main() -> Result<(), ChaosError> {
    dotenvy::dotenv()?;

    let app = app().await?;
    let listener = tokio::net::TcpListener::bind("0.0.0.0:8000").await.unwrap();
    axum::serve(listener, app).await.unwrap();
    println!("server running on port 8000");

    Ok(())
}
