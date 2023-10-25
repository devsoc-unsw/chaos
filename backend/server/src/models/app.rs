use sqlx::{Pool, Postgres};
use reqwest::Client as ReqwestClient;

pub struct AppState {
    pub db: Pool<Postgres>,
    pub ctx: ReqwestClient
}