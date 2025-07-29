use crate::models::app::app;
use crate::models::error::ChaosError;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use std::net::SocketAddr;

mod handler;
mod models;
mod service;

#[tokio::main]
async fn main() -> Result<(), ChaosError> {
    dotenvy::dotenv()?;

    // Initialize tracing
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "info".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Build our application
    let app = app().await?;

    // Run it with hyper on localhost:8080
    let addr = SocketAddr::from(([127, 0, 0, 1], 8080));
    println!("server running on port 8080");
    
    axum::serve(
        tokio::net::TcpListener::bind(&addr).await.unwrap(),
        app.into_make_service_with_connect_info::<SocketAddr>(),
    ).await.unwrap();

    Ok(())
}
