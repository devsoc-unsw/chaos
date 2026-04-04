use std::ops::DerefMut;

use chrono::{DateTime, Utc};
use serde::Deserialize;
use snowflake::SnowflakeIdGenerator;
use sqlx::{Postgres, Transaction};

use crate::models::error::ChaosError;

#[derive(Deserialize, sqlx::FromRow)]
pub struct Availability {
    start_time: DateTime<Utc>,
}

#[derive(Deserialize, sqlx::FromRow)]
pub struct UserCampaignId {
    id: i64,
}

pub struct AvailabilitiesHandler;

impl AvailabilitiesHandler {
    // ------------------------- Context -------------------------
    // `user_campaign_availabilities` and `availability_slots` use a two-table design
    // to avoid repeating `user_id` and `campaign_id` on every slot row.
    // Because a single user can submit hundreds of 15-minute availability windows
    // per campaign,storing those columns once in `availabilities` (one row per
    // user–campaign pair) and referencing it via FK in `availability_slots` keeps
    // the slots table narrow and avoids redundant data.
    //
    // Note that UC or UC pair as used in this file refers to the data stored
    // in one row of the user_campaign_availabilities table

    // ------------------------ Operations -----------------------

    /// Creates an ID for a user-campaign availability pair
    ///
    /// # Arguments
    /// * `user_id` - ID of the user interviewer
    /// * `campaign_id` - ID of the campaign in which the user will be interviewing
    /// * `snowflake_generator` - A generator for creating unique IDs
    /// * `transaction` - A mutable reference to the database transaction
    ///
    /// # Returns
    /// Returns a `Result` containing either:
    /// * `Ok(id)` - If the UC pair was created successfully, where id is its ID
    /// * `Err(ChaosError)` - If creation fails
    ///

    pub async fn create_user_campaign_availabilitty(
        user_id: i64,
        campaign_id: i64,
        snowflake_generator: &mut SnowflakeIdGenerator,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<(), ChaosError> {
        let id = snowflake_generator.real_time_generate();

        sqlx::query!(
            "
                INSERT INTO user_campaign_availabilities (id, user_id, campaign_id)
                    VALUES ($1, $2, $3)
            ",
            id,
            user_id,
            campaign_id
        )
        .execute(transaction.deref_mut())
        .await?;

        Ok(())
    }

    /// Creates availability slots in bulk for a given user-campaign.
    /// Designed to create in bulk to avoid multiple calls to the database
    ///
    /// # Arguments
    /// * `availability_id` - ID of the UC pair
    /// * `availabilities`- Vec of start times, must align to 15min boundaries
    /// * `transaction` - A mutable reference to the database transaction
    ///
    /// # Returns
    /// Returns a `Result` containing either:
    /// * `Ok(())` - If ALL the timeslots were successfully created
    /// * `Err(ChaosError)` - If creation of ANY fails

    pub async fn create_availability_slots(
        availability_id: i64,
        availabilities: Vec<Availability>,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<(), ChaosError> {
        let start_times: Vec<DateTime<Utc>> =
            availabilities.into_iter().map(|a| a.start_time).collect();

        sqlx::query!(
            "
                INSERT INTO availability_slots (availability_id, start_time)
                    SELECT $1, UNNEST($2::timestamptz[])
            ",
            availability_id,
            &start_times as &[DateTime<Utc>]
        )
        .execute(transaction.deref_mut())
        .await?;

        Ok(())
    }

    /// Gets all available slots for a given UC pair
    ///
    /// # Arguments
    /// * `user_id` - ID of the interviewer
    /// * `campaign_id` - ID of the campaign in which the user will be interviewing
    ///
    /// # Returns
    /// Returns a `Result` containing either
    /// * `Ok(Vec<Availabilities>)` - a Vec of all the availabilities
    /// * `Err(ChaosError)`- If no such user campaign pair found

    pub async fn get_availaibility_slots(
        user_id: i64,
        campaign_id: i64,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<Vec<Availability>, ChaosError> {
        let slots = sqlx::query_as!(
            Availability,
            "
                SELECT start_time
                FROM user_campaign_availabilities uc
                RIGHT JOIN availability_slots s ON uc.id = s.availability_id
                WHERE user_id = $1
                AND campaign_id = $2
            ",
            user_id,
            campaign_id
        )
        .fetch_all(transaction.deref_mut())
        .await?;

        Ok(slots)
    }

    /// Gets the UC id for a given user_id and campaign id
    ///
    /// # Arguments
    /// * `user_id` - ID of the interviewer
    /// * `campaign_id` - ID of the campaign in which the user will be interviewing
    ///
    /// # Returns
    /// Returns a `Result` containing either
    /// * `Ok(i64)` - the UC id
    /// * `Err(ChaosError)` - If no such user user campaign pair is found

    pub async fn get_user_campaign_id(
        user_id: i64,
        campaign_id: i64,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<UserCampaignId, ChaosError> {
        let user_campaign_id = sqlx::query_as!(
            UserCampaignId,
            "
                SELECT id
                FROM user_campaign_availabilities
                WHERE user_id = $1
                AND campaign_id = $2
            ",
            user_id,
            campaign_id
        )
        .fetch_one(transaction.deref_mut())
        .await?;

        Ok(user_campaign_id)
    }

    /// Deletes the given availability slots for a given user
    ///
    /// # Arguments
    /// * `user_id` - ID of the interviewer
    /// * `campaign_id` - ID of the campaign in which the user will be interviewing
    /// * `availabilities`- Vec of start times, must align to 15min boundaries
    ///
    /// # Returns
    /// Returns a `Result` containing either
    /// * `Ok(())` - if update was successful
    /// * `Err(ChaosError)` - if update was unsuccessful

    pub async fn delete_availabilities(
        user_id: i64,
        campaign_id: i64,
        availabilities: Vec<Availability>,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<(), ChaosError> {
        let start_times: Vec<DateTime<Utc>> = availabilities.iter().map(|a| a.start_time).collect();

        sqlx::query!(
            "
                DELETE FROM availability_slots s
                USING user_campaign_availabilities uc
                WHERE uc.id = s.availability_id
                AND uc.user_id = $1
                AND uc.campaign_id = $2
                AND s.start_time = ANY($3::timestamptz[])
            ",
            user_id,
            campaign_id,
            &start_times as &[DateTime<Utc>]
        )
        .execute(transaction.deref_mut())
        .await?;

        Ok(())
    }

    /// Deletes a UC pair
    ///
    /// # Arguments
    /// * `user_id` - ID of the interviewer
    /// * `campaign_id` - ID of the campaign in which the user will be interviewing
    ///
    /// # Returns
    /// Returns a `Result` containing either
    /// * `Ok(())` - if update was successful
    /// * `Err(ChaosError)` - if update was unsuccessful

    pub async fn delete_user_campaign(
        user_id: i64,
        campaign_id: i64,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<(), ChaosError> {
        sqlx::query!(
            "
                DELETE FROM user_campaign_availabilities
                WHERE user_id = $1
                AND campaign_id = $2
            ",
            user_id,
            campaign_id
        )
        .execute(transaction.deref_mut())
        .await?;

        Ok(())
    }
}
