use crate::models::error::ChaosError;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use snowflake::SnowflakeIdGenerator;
use sqlx::{FromRow, Pool, Postgres, Transaction};
use std::ops::DerefMut;

#[derive(Deserialize, Serialize, Clone, FromRow, Debug)]
pub struct Application {
    pub id: i64,
    pub campaign_id: i64,
    pub user_id: i64,
    pub status: ApplicationStatus,
    pub private_status: ApplicationStatus,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/*
    User could apply for more than one roles at a time, for each application
    into a role it will be represented by row in application_roles table which
    is linked to the main Application body through application_id
*/
#[derive(Deserialize, Serialize, Clone, FromRow, Debug)]
pub struct ApplicationRole {
    pub id: i64,
    pub application_id: i64,
    pub campaign_role_id: i64,
}

pub struct NewApplication {
    pub user_id: i64,
    pub status: ApplicationStatus,
    pub private_status: ApplicationStatus,
    pub applied_roles: Vec<ApplicationRole>,
}


#[derive(Deserialize, Serialize, sqlx::Type, Clone, Debug)]
#[sqlx(type_name = "application_status", rename_all = "PascalCase")]
pub enum ApplicationStatus {
    Pending,
    Rejected,
    Successful,
}

impl Application {
    pub async fn create(
        campaign_id: i64,
        application_data: NewApplication,
        mut snowflake_generator: SnowflakeIdGenerator,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<(), ChaosError> {
        let id = snowflake_generator.generate();

        // Insert into table applications
        sqlx::query!(
            "
                INSERT INTO applications (id, campaign_id, user_id, status, private_status)
                VALUES ($1, $2, $3, $4, $5)
            ",
            id,
            campaign_id,
            application_data.user_id,
            application_data.status as ApplicationStatus,
            application_data.private_status as ApplicationStatus,
        )
        .execute(transaction.deref_mut())
        .await?;

        // Insert into table application_roles
        for role_applied in application_data.applied_roles {
            sqlx::query!(
                "
                    INSERT INTO application_roles (application_id, campaign_role_id)
                    VALUES ($1, $2)
                ",
                id,
                role_applied.campaign_role_id
            )
            .execute(transaction.deref_mut())
            .await?;
        }

        Ok(())
    }
}