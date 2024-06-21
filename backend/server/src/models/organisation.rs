use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Deserialize, Serialize, Clone, FromRow, Debug)]
pub struct Organisation {
    pub id: i64,
    pub name: String,
    pub logo: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub campaigns: Vec<Campaign>, // Awaiting Campaign to be complete - remove comment once done
    pub organisation_admins: Vec<i64>,
}

#[derive(Deserialize, Serialize)]
pub struct NewOrganisation {
    pub name: String,
    pub admin: i64,
}

#[derive(Deserialize, Serialize)]
pub struct OrganisationDetails {
    pub id: i64,
    pub name: String,
    pub logo: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Deserialize, Serialize, FromRow)]
pub struct Member {
    pub id: i64,
    pub name: String,
}

#[derive(Deserialize, Serialize)]
pub struct MemberList {
    pub members: Vec<Member>,
}

#[derive(Deserialize, Serialize)]
pub struct AdminUpdateList {
    pub members: Vec<i64>,
}

#[derive(Deserialize, Serialize)]
pub struct AdminToRemove {
    pub user_id: i64,
}
