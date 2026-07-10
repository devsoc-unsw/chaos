use std::{hash::Hash, ops::DerefMut};

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use snowflake::SnowflakeIdGenerator;
use sqlx::{Postgres, Transaction};

use crate::models::error::ChaosError;

#[derive(Serialize, Deserialize, sqlx::FromRow, PartialEq)]
pub struct Availability {
    start_time: DateTime<Utc>,
}

impl Eq for Availability {}

impl Hash for Availability {
    fn hash<H: std::hash::Hasher>(&self, state: &mut H) {
        self.start_time.hash(state);
    }
}

#[derive(Deserialize, sqlx::FromRow)]
pub struct UserCampaignId {
    pub id: i64,
}

pub struct Availabilities;

impl Availabilities {
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
    /// * `user_id` - ID of the interviewer
    /// * `campaign_id` - ID of the campaign in which the user will be interviewing
    /// * `snowflake_generator` - A generator for creating unique IDs
    /// * `transaction` - A mutable reference to the database transaction
    ///
    /// # Returns
    /// Returns a `Result` containing either:
    /// * `Ok(id)` - If the UC pair was created successfully, where id is its ID
    /// * `Err(ChaosError)` - If creation fails
    ///

    pub async fn create_user_campaign_availability(
        user_id: i64,
        campaign_id: i64,
        snowflake_generator: &mut SnowflakeIdGenerator,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<i64, ChaosError> {
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

        Ok(id)
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

    pub async fn get_availability_slots(
        availability_id: i64,
        transaction: &mut Transaction<'_, Postgres>,
    ) -> Result<Vec<Availability>, ChaosError> {
        let slots = sqlx::query_as!(
            Availability,
            "
                SELECT start_time
                FROM availability_slots
                WHERE availability_id = $1
                ",
            availability_id
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
    /// * `Err(ChaosError)` - If no such user campaign pair is found

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
}

#[cfg(test)]
mod tests {
    // =========================================================================
    // TEST PLAN – Equivalence Partitioning (EP) & Boundary Value Analysis (BVA)
    // =========================================================================
    //
    // Functions under test
    //   · <Availability as PartialEq>::eq — derived, compares start_time only
    //   · <Availability as Hash>::hash    — hand-written, hashes start_time only
    //
    // Availability is used in HashSet-based de-duplication of interview slots, so
    // its identity is defined entirely by start_time. The Eq/Hash contract
    // (equal values hash equal) is what makes that de-duplication correct.
    //
    // ── EQUIVALENCE PARTITIONING ──────────────────────────────────────────────
    //
    //  ID    Pair                              Class          Expected           Test
    //  EP01  same start_time                   equal          eq && hash equal   equal_when_start_times_match
    //  EP02  different start_time              distinct       !eq                unequal_when_start_times_differ
    //
    // ── BOUNDARY VALUE ANALYSIS ───────────────────────────────────────────────
    //
    //  Not applicable: identity is a single timestamp equality; there is no
    //  ordered boundary being partitioned, only the equal/not-equal dichotomy.
    //
    // ── KNOWN GAPS ────────────────────────────────────────────────────────────
    //
    //  · The async DB methods (create_user_campaign_availability,
    //    create_availability_slots, get_*, delete_availabilities) need a Postgres
    //    pool and a user → campaign seed graph, so they belong in an
    //    #[sqlx::test] suite and are unverified here.
    // =========================================================================

    use super::*;
    use std::collections::hash_map::DefaultHasher;
    use std::hash::Hasher;

    // ── helpers ──────────────────────────────────────────────────────────────

    /// Hashes a value through the same Hash impl HashSet would use.
    fn hash_of(a: &Availability) -> u64 {
        let mut hasher = DefaultHasher::new();
        a.hash(&mut hasher);
        hasher.finish()
    }

    /// White-box: two slots at the same instant are equal and hash identically.
    #[test]
    fn equal_when_start_times_match() {
        let instant = Utc::now();
        let a = Availability { start_time: instant };
        let b = Availability { start_time: instant };
        assert!(a == b, "same start_time must be equal");
        assert_eq!(hash_of(&a), hash_of(&b), "equal values must hash equally");
    }

    /// White-box: slots at different instants are not equal.
    #[test]
    fn unequal_when_start_times_differ() {
        let a = Availability { start_time: Utc::now() };
        let b = Availability {
            start_time: Utc::now() + chrono::Duration::minutes(15),
        };
        assert!(a != b, "different start_time must not be equal");
    }
}
