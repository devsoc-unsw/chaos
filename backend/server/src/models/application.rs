use crate::models::error::ChaosError;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use snowflake::SnowflakeIdGenerator;
use sqlx::{FromRow, Pool, Postgres, Transaction};
use std::ops::DerefMut;
use crate::models::user::UserDetails;

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
    pub applied_roles: Vec<ApplicationRole>,
}

#[derive(Deserialize, Serialize)]
pub struct ApplicationDetails {
    pub id: i64,
    pub campaign_id: i64,
    pub user: UserDetails,
    pub status: ApplicationStatus,
    pub private_status: ApplicationStatus,
    pub applied_roles: Vec<ApplicationAppliedRoleDetails>
}

#[derive(Deserialize, Serialize)]
pub struct ApplicationData {
    pub id: i64,
    pub campaign_id: i64,
    pub user_id: i64,
    pub user_email: String,
    pub user_zid: Option<String>,
    pub user_name: String,
    pub user_pronouns: String,
    pub user_gender: String,
    pub user_degree_name: Option<String>,
    pub user_degree_starting_year: Option<i32>,
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
        user_id: i64,
        application_data: NewApplication,
        mut snowflake_generator: SnowflakeIdGenerator,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<(), ChaosError> {
        let id = snowflake_generator.generate();

        // Insert into table applications
        sqlx::query!(
            "
                INSERT INTO applications (id, campaign_id, user_id)
                VALUES ($1, $2, $3)
            ",
            id,
            campaign_id,
            user_id
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
                SELECT a.id AS id, campaign_id, user_id, status AS \"status: ApplicationStatus\",
                private_status AS \"private_status: ApplicationStatus\", u.email AS user_email,
                u.zid AS user_zid, u.name AS user_name, u.gender AS user_gender,
                u.pronouns AS user_pronouns, u.degree_name AS user_degree_name,
                u.degree_starting_year AS user_degree_starting_year
                FROM applications a LEFT JOIN users u ON u.id = a.user_id
                WHERE a.id = $1
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

        Ok(
            ApplicationDetails {
                id: application_data.id,
                campaign_id: application_data.campaign_id,
                status: application_data.status,
                private_status: application_data.private_status,
                applied_roles,
                user: UserDetails {
                    id: application_data.user_id,
                    email: application_data.user_email,
                    zid: application_data.user_zid,
                    name: application_data.user_name,
                    pronouns: application_data.user_pronouns,
                    gender: application_data.user_gender,
                    degree_name: application_data.user_degree_name,
                    degree_starting_year: application_data.user_degree_starting_year,
                },
            }
        )
    }


    /*
        Get All applications that apply for a given role
     */
    pub async fn get_from_role_id(role_id: i64, transaction: &mut Transaction<'_, Postgres>,)
    -> Result<Vec<ApplicationDetails>, ChaosError> {
        let application_data_list = sqlx::query_as!(
            ApplicationData,
            "
                SELECT a.id AS id, campaign_id, user_id, status AS \"status: ApplicationStatus\",
                private_status AS \"private_status: ApplicationStatus\", u.email AS user_email,
                u.zid AS user_zid, u.name AS user_name, u.gender AS user_gender,
                u.pronouns AS user_pronouns, u.degree_name AS user_degree_name,
                u.degree_starting_year AS user_degree_starting_year
                FROM applications a LEFT JOIN users u ON u.id = a.user_id LEFT JOIN application_roles ar on ar.application_id = a.id
                WHERE ar.id = $1
            ",
            role_id
        )
            .fetch_all(transaction.deref_mut())
            .await?;

        let mut application_details_list = Vec::new();
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

            let details = ApplicationDetails {
                id: application_data.id,
                campaign_id: application_data.campaign_id,
                status: application_data.status,
                private_status: application_data.private_status,
                applied_roles,
                user: UserDetails {
                    id: application_data.user_id,
                    email: application_data.user_email,
                    zid: application_data.user_zid,
                    name: application_data.user_name,
                    pronouns: application_data.user_pronouns,
                    gender: application_data.user_gender,
                    degree_name: application_data.user_degree_name,
                    degree_starting_year: application_data.user_degree_starting_year,
                },
            };

            application_details_list.push(details);
        }

        Ok(application_details_list)
    }

    /*
        Get All applications that apply for a given campaign
     */
    pub async fn get_from_campaign_id(campaign_id: i64, transaction: &mut Transaction<'_, Postgres>,)
    -> Result<Vec<ApplicationDetails>, ChaosError> {
        let application_data_list = sqlx::query_as!(
            ApplicationData,
            "
                SELECT a.id AS id, campaign_id, user_id, status AS \"status: ApplicationStatus\",
                private_status AS \"private_status: ApplicationStatus\", u.email AS user_email,
                u.zid AS user_zid, u.name AS user_name, u.gender AS user_gender,
                u.pronouns AS user_pronouns, u.degree_name AS user_degree_name,
                u.degree_starting_year AS user_degree_starting_year
                FROM applications a LEFT JOIN users u ON u.id = a.user_id
                WHERE a.campaign_id = $1
            ",
            campaign_id
        )
            .fetch_all(transaction.deref_mut())
            .await?;

        let mut application_details_list = Vec::new();
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

            let details = ApplicationDetails {
                id: application_data.id,
                campaign_id: application_data.campaign_id,
                status: application_data.status,
                private_status: application_data.private_status,
                applied_roles,
                user: UserDetails {
                    id: application_data.user_id,
                    email: application_data.user_email,
                    zid: application_data.user_zid,
                    name: application_data.user_name,
                    pronouns: application_data.user_pronouns,
                    gender: application_data.user_gender,
                    degree_name: application_data.user_degree_name,
                    degree_starting_year: application_data.user_degree_starting_year,
                },
            };
            
            application_details_list.push(details)
        }

        Ok(application_details_list)
    }

    /*
        Get All applications that are made by a given user
     */
    pub async fn get_from_user_id(user_id: i64, transaction: &mut Transaction<'_, Postgres>,)
    -> Result<Vec<ApplicationDetails>, ChaosError> {
        let application_data_list = sqlx::query_as!(
            ApplicationData,
            "
                SELECT a.id AS id, campaign_id, user_id, status AS \"status: ApplicationStatus\",
                private_status AS \"private_status: ApplicationStatus\", u.email AS user_email,
                u.zid AS user_zid, u.name AS user_name, u.gender AS user_gender,
                u.pronouns AS user_pronouns, u.degree_name AS user_degree_name,
                u.degree_starting_year AS user_degree_starting_year
                FROM applications a LEFT JOIN users u ON u.id = a.user_id
                WHERE a.user_id = $1
            ",
            user_id
        )
            .fetch_all(transaction.deref_mut())
            .await?;

        let mut application_details_list = Vec::new();
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

            let details = ApplicationDetails {
                id: application_data.id,
                campaign_id: application_data.campaign_id,
                status: application_data.status,
                private_status: application_data.private_status,
                applied_roles,
                user: UserDetails {
                    id: application_data.user_id,
                    email: application_data.user_email,
                    zid: application_data.user_zid,
                    name: application_data.user_name,
                    pronouns: application_data.user_pronouns,
                    gender: application_data.user_gender,
                    degree_name: application_data.user_degree_name,
                    degree_starting_year: application_data.user_degree_starting_year,
                },
            };

            application_details_list.push(details)
        }

        Ok(application_details_list)
    }

    pub async fn set_status(id: i64, new_status: ApplicationStatus, pool: &Pool<Postgres>) -> Result<(), ChaosError> {
        sqlx::query!(
            "
                UPDATE applications
                SET status = $2
                WHERE id = $1;
            ",
            id,
            new_status as ApplicationStatus
        )
        .execute(pool)
        .await?;

        Ok(())
    }

    pub async fn set_private_status(id: i64, new_status: ApplicationStatus, pool: &Pool<Postgres>) -> Result<(), ChaosError> {
        sqlx::query!(
            "
                UPDATE applications
                SET private_status = $2
                WHERE id = $1;
            ",
            id,
            new_status as ApplicationStatus
        )
        .execute(pool)
        .await?;

        Ok(())
    }

}