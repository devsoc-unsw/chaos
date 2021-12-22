pub mod schema;
pub mod models;

use rocket_sync_db_pools::database;

#[database("database")]
pub struct Database(diesel::PgConnection);
