use jsonwebtoken::{DecodingKey, EncodingKey};
use reqwest::Client as ReqwestClient;
use sqlx::{Pool, Postgres};

#[derive(Clone)]
pub struct AppState {
    pub db: Pool<Postgres>,
    pub ctx: ReqwestClient,
    pub decoding_key: DecodingKey,
    pub encoding_key: EncodingKey,
}
