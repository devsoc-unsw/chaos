use crate::models::app::app;
use crate::models::email::EmailQueue;
use crate::models::error::ChaosError;
use crate::models::seeder::Seeder;

mod constants;
mod etl;
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

    // Track SpiceDB revisions, publishing the freshness boundary used by
    // permission checks. This task is the sole writer of the stored ZedToken:
    // it applies tokens sent by write paths and, as a fallback for writes made
    // elsewhere (including the ETL pipeline), tokens from the Watch API.
    let watcher_task = tokio::spawn(spicedb::spawn_zedtoken_watcher(
        state_clone.clone(),
        spicedb_token_rx,
    ));

    // Postgres -> SpiceDB ETL pipeline, single-leader elected by advisory lock.
    // The boot election decides this instance's role: a leader start failure
    // fails boot loudly, while followers boot as API-only servers and pick up
    // leadership later if the lock frees up.
    let etl_task = tokio::spawn({
        let state = state_clone.clone();
        async move {
            let etl_role = if !etl::disabled() {
                Some(
                    etl::elect_and_start(
                        &state.db,
                        state.spicedb.clone(),
                        state.spicedb_key.clone(),
                        state.spicedb_token_tx.clone(),
                    )
                    .await?,
                )
            } else {
                println!("ETL pipeline disabled (set ETL_DISABLED=false to enable)");
                None
            };

            match etl_role {
                Some(etl::EtlRole::Leader { pipeline, lock }) => {
                    etl::supervise(
                        state.db.clone(),
                        state.spicedb.clone(),
                        state.spicedb_key.clone(),
                        state.spicedb_token_tx.clone(),
                        pipeline,
                        lock,
                    )
                    .await;
                }
                Some(etl::EtlRole::Follower) => {
                    etl::campaign(
                        state.db.clone(),
                        state.spicedb.clone(),
                        state.spicedb_key.clone(),
                        state.spicedb_token_tx.clone(),
                    )
                    .await;
                }
                None => {}
            }
            Ok::<(), ChaosError>(())
        }
    });

    let super_user_email =
        std::env::var("CHAOS_SUPER_USER_EMAIL").expect("CHAOS_SUPER_USER_EMAIL must be set");
    let mut seeder = Seeder::init(state_clone.clone()).await;
    seeder.seed_database(super_user_email).await?;

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

    let _ = tokio::join!(server_task, email_task, watcher_task, etl_task);

    Ok(())
}
