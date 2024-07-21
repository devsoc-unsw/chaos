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

#[derive(Deserialize, Serialize)]
pub struct NewApplication {
    pub user_id: i64,
    pub status: ApplicationStatus,
    pub private_status: ApplicationStatus,
    pub applied_roles: Vec<ApplicationRole>,
}

#[derive(Deserialize, Serialize)]
pub struct ApplicationDetails {
    pub application_data: ApplicationData,
    pub applied_roles: Vec<ApplicationAppliedRoleDetails>
}

#[derive(Deserialize, Serialize)]
pub struct ApplicationData {
    pub id: i64,
    pub campaign_id: i64,
    pub user_id: i64,
    pub status: ApplicationStatus,
    pub private_status: ApplicationStatus,
}

#[derive(Deserialize, Serialize)]
pub struct ApplicationAppliedRoleDetails {
    pub campaign_role_id: i64,
    pub role_name: String,
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

    /*
        Get Application given an application id
     */
    pub async fn get(id: i64, transaction: &mut Transaction<'_, Postgres>,) -> Result<ApplicationDetails, ChaosError> {
        let application_data = sqlx::query_as!(
            ApplicationData,
            "
                SELECT id, campaign_id, user_id, status AS \"status: ApplicationStatus\",
                private_status AS \"private_status: ApplicationStatus\"
                FROM applications
                WHERE id = $1
            ",
            id
        )
        .fetch_one(transaction.deref_mut())
        .await?;

        let applied_roles = sqlx::query_as!(
            ApplicationAppliedRoleDetails,
            "
                SELECT application_roles.campaign_role_id, campaign_roles.name AS role_name
                FROM application_roles
                    LEFT JOIN campaign_roles
                    ON application_roles.campaign_role_id = campaign_roles.id
                WHERE application_id = $1
            ",
            id
        )
        .fetch_all(transaction.deref_mut())
        .await?;

        Ok(ApplicationDetails {application_data, applied_roles})
    }


    /*
        Get All applications that apply for a given role
     */
    pub async fn get_from_role_id(role_id: i64, transaction: &mut Transaction<'_, Postgres>,)
    -> Result<Vec<ApplicationData>, ChaosError> {
        let applications = sqlx::query_as!(
            ApplicationData,
            "
                SELECT applications.id, campaign_id, user_id, status AS \"status: ApplicationStatus\",
                private_status AS \"private_status: ApplicationStatus\"
                FROM applications
                    JOIN application_roles
                    ON application_roles.application_id = applications.id
                WHERE application_roles.campaign_role_id = $1
            ",
            role_id
        )
        .fetch_all(transaction.deref_mut())
        .await?;

        Ok(applications)
    }

    /*
        Get All applications that apply for a given campaign
     */
    pub async fn get_from_campaign_id(campaign_id: i64, transaction: &mut Transaction<'_, Postgres>,)
    -> Result<Vec<ApplicationDetails>, ChaosError> {
        let mut application_details_list = Vec::new();
        let application_data_list = sqlx::query_as!(
            ApplicationData,
            "
                SELECT id, campaign_id, user_id, status AS \"status: ApplicationStatus\",
                private_status AS \"private_status: ApplicationStatus\"
                FROM applications
                WHERE campaign_id = $1
            ",
            campaign_id
        )
        .fetch_all(transaction.deref_mut())
        .await?;

        for application_data in application_data_list {
            let applied_roles = sqlx::query_as!(
                ApplicationAppliedRoleDetails,
                "
                    SELECT application_roles.campaign_role_id, campaign_roles.name AS role_name
                    FROM application_roles
                        LEFT JOIN campaign_roles
                        ON application_roles.campaign_role_id = campaign_roles.id
                    WHERE application_id = $1
                ",
                application_data.id
            )
            .fetch_all(transaction.deref_mut())
            .await?;
            
            application_details_list.push(ApplicationDetails{application_data, applied_roles})
        }

        Ok(application_details_list)
    }

    /*
        Get All applications that are made by a given user
     */
    pub async fn get_from_user_id(user_id: i64, transaction: &mut Transaction<'_, Postgres>,)
    -> Result<Vec<ApplicationDetails>, ChaosError> {
        let mut application_details_list = Vec::new();
        let application_data_list = sqlx::query_as!(
            ApplicationData,
            "
                SELECT id, campaign_id, user_id, status AS \"status: ApplicationStatus\",
                private_status AS \"private_status: ApplicationStatus\"
                FROM applications
                WHERE user_id = $1
            ",
            user_id
        )
        .fetch_all(transaction.deref_mut())
        .await?;

        for application_data in application_data_list {
            let applied_roles = sqlx::query_as!(
                ApplicationAppliedRoleDetails,
                "
                    SELECT application_roles.campaign_role_id, campaign_roles.name AS role_name
                    FROM application_roles
                        LEFT JOIN campaign_roles
                        ON application_roles.campaign_role_id = campaign_roles.id
                    WHERE application_id = $1
                ",
                application_data.id
            )
            .fetch_all(transaction.deref_mut())
            .await?;
            
            application_details_list.push(ApplicationDetails{application_data, applied_roles})
        }

        Ok(application_details_list)
    }

}