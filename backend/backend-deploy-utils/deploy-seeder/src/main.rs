use crate::seeder::*;
pub mod seeder;

#[tokio::main]
async fn main() {
    dotenvy::dotenv().ok();

    let seeder = init().await;

    seed_database(seeder).await;
}
