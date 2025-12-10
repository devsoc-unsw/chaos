use clap::Parser;
use crate::seeder::*;
pub mod seeder;

/// Seed data for development use
#[derive(Parser, Debug)]
#[command(version, about, long_about = None)]
struct Args {
    /// Your Google account email - will be used to provide Organisation Admin & SuperUser privileges
    #[arg(short, long)]
    pub email: String,
}

#[tokio::main]
async fn main() {
    dotenvy::dotenv().expect("Failed to load .env");
    let args = Args::parse();

    let seeder = init().await;

    seed_database(args.email.to_lowercase(), seeder).await;
}
