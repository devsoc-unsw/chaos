use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use schemars::JsonSchema;

#[derive(Deserialize, Serialize, Clone, Debug, JsonSchema)]
pub struct Campaign {
    pub id: i64,
    pub name: String,
    pub description: Option<String>,
    pub cover_image: Option<String>,
    pub starts_at: DateTime<Utc>,
    pub ends_at: DateTime<Utc>,
}
