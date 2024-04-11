use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use chrono::{DateTime, Utc};

#[derive(Deserialize, Serialize, Clone, FromRow, Debug)]
pub struct Organisation {
    pub id: i64,
    pub name: String,
    pub logo: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub campaigns: Vec<Campaign>,                       // Awaiting Campaign to be complete - remove comment once done
    pub organisation_admins: Vec<OrganisationAdmins>
}

#[derive(Deserialize, Serialize, Clone, Debug)]
pub struct OrganisationAdmins {
    pub organisation_id: i64,    // References id in Organisation table
    pub user_id: i64             // References id in User table
}
