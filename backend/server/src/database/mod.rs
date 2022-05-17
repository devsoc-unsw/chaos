pub mod models;
pub mod schema;

use rocket_sync_db_pools::database;

#[database("database")]
pub struct Database(diesel::PgConnection);
