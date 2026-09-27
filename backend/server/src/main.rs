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

    let (app, state_clone) = app().await?;

    // Run DB migrations
    sqlx::migrate!("../migrations").run(&state_clone.db).await?;
    println!("Migrations ran successfully!");

    // Run SpiceDB migrations (upsert the schema from spicedb/schema.yaml)
    spicedb::migrate_schema().await?;
    println!("SpiceDB migrations ran successfully!");

    // Track SpiceDB revisions via the Watch API so permission checks use a
    // monotonically increasing freshness boundary.
    let watcher_task = tokio::spawn(spicedb::spawn_zedtoken_watcher(state_clone.clone()));

    let super_user_email =
        std::env::var("CHAOS_SUPER_USER_EMAIL").expect("CHAOS_SUPER_USER_EMAIL must be set");
    let mut seeder = Seeder::init(state_clone.clone()).await;
    seeder.seed_database(super_user_email).await?;

    // Postgres -> SpiceDB ETL pipeline, single-leader elected by advisory lock.
    // The boot election decides this instance's role: a leader start failure
    // fails boot loudly, while followers boot as API-only servers and pick up
    // leadership later if the lock frees up.
    let etl_role = if etl::enabled() {
        Some(
            etl::elect_and_start(
                &state_clone.db,
                state_clone.spicedb.clone(),
                state_clone.spicedb_key.clone(),
            )
            .await?,
        )
    } else {
        println!("ETL pipeline disabled (set ETL_ENABLED=true to enable)");
        None
    };

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

    let etl_future = async {
        match etl_role {
            Some(etl::EtlRole::Leader { pipeline, lock }) => {
                etl::supervise(
                    state_clone.db.clone(),
                    state_clone.spicedb.clone(),
                    state_clone.spicedb_key.clone(),
                    pipeline,
                    lock,
                )
                .await;
            }
            Some(etl::EtlRole::Follower) => {
                etl::campaign(
                    state_clone.db.clone(),
                    state_clone.spicedb.clone(),
                    state_clone.spicedb_key.clone(),
                )
                .await;
            }
            None => {}
        }
    };

    let _ = tokio::join!(server_task, email_task, etl_future, watcher_task);

    Ok(())
}
