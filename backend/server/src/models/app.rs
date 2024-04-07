use jsonwebtoken::{DecodingKey, EncodingKey, Header, Validation};
use reqwest::Client as ReqwestClient;
use snowflake::SnowflakeIdGenerator;
use sqlx::{Pool, Postgres};

#[derive(Clone)]
pub struct AppState {
    pub db: Pool<Postgres>,
    pub ctx: ReqwestClient,
    pub decoding_key: DecodingKey,
    pub encoding_key: EncodingKey,
    pub jwt_header: Header,
    pub jwt_validator: Validation,
    pub snowflake_generator: SnowflakeIdGenerator,
}
