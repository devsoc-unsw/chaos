use crate::models::app::app;
use crate::models::email::EmailQueue;
use crate::models::error::ChaosError;
use crate::models::seeder::Seeder;

mod constants;
mod handler;
mod models;
mod service;
mod spicedb;

#[tokio::main]
async fn main() -> Result<(), ChaosError> {
    // Try to load .env file, but don't fail if it doesn't exist (env vars may be set via Docker)
    dotenvy::dotenv().ok();

    let (app, state_clone, spicedb_token_rx) = app().await?;

    // Run DB migrations
    sqlx::migrate!("../migrations").run(&state_clone.db).await?;
    println!("Migrations ran successfully!");

    // Run SpiceDB migrations (upsert the schema from spicedb/schema.yaml)
    spicedb::migrate_schema().await?;
    println!("SpiceDB migrations ran successfully!");

    // Apply the ZedTokens published by every SpiceDB write path, keeping the
    // freshness boundary used by permission checks up to date. This task is the
    // only writer of the stored token.
    let token_task = tokio::spawn(spicedb::apply_zedtokens(
        state_clone.spicedb_zedtoken.clone(),
        spicedb_token_rx,
    ));

    let super_user_email =
        std::env::var("CHAOS_SUPER_USER_EMAIL").expect("CHAOS_SUPER_USER_EMAIL must be set");
    let mut seeder = Seeder::init(state_clone.clone()).await;
    seeder.seed_database(super_user_email).await?;

    // Periodically converge SpiceDB with Postgres: trigger a Sequin backfill for
    // missing relationships and sweep for orphaned ones. Every replica spawns
    // this, but the advisory lock inside means only one reconciles per tick.
    let reconcile_task = tokio::spawn(service::reconcile::spawn_reconciler(state_clone.clone()));

    let email_db = state_clone.db.clone();
    let email_task = tokio::spawn(async move {
        loop {
            let mut transaction = email_db.begin().await.unwrap();
            if let Err(e) =
                EmailQueue::send_next(state_clone.email_credentials.clone(), &mut transaction).await
            {
                e.print();
            } else {
                transaction.commit().await.unwrap();
            }

            // Small delay to prevent excessive CPU usage
            tokio::time::sleep(std::time::Duration::from_millis(1000)).await;
        }
    });

    let listener = tokio::net::TcpListener::bind("0.0.0.0:8080").await.unwrap();
    let server_task = axum::serve(listener, app);

    let _ = tokio::join!(server_task, email_task, token_task, reconcile_task);

    Ok(())
}
