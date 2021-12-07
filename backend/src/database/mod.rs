pub mod schema;
pub mod guard;
pub mod models;

use dotenv_codegen::dotenv;
use diesel::{
    PgConnection,
    r2d2::{self, ConnectionManager},
};

pub type Pool = r2d2::Pool<ConnectionManager<PgConnection>>;

pub fn pool() -> Pool {
    let database_url = dotenv!("DATABASE_URL");

    let connection_pool = Pool::new(ConnectionManager::<PgConnection>::new(database_url))
        .expect("Could not establish connection pool to the database");
    
    connection_pool
}
