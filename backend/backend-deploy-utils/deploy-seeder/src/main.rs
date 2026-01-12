use crate::seeder::*;
pub mod seeder;

#[tokio::main]
async fn main() {
    dotenvy::dotenv().expect("Failed to load .env");

    let seeder = init().await;

    seed_database(seeder).await;
}
