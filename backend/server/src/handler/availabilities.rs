use std::collections::HashSet;

use axum::{
    extract::{Json, Path, State},
    http::StatusCode,
    response::IntoResponse,
};

use crate::models::{
    app::{AppMessage, AppState, AvailabilitiesMessage},
    auth::AuthUser,
    availabilities::{Availabilities, Availability},
    error::ChaosError,
    transaction::DBTransaction,
};

pub struct AvailabilitiesHandler;

/// Gets or creates the user-campaign id, helper function
///
/// # Arguments
/// * `user_id` - ID of the user for the UC pair
/// * `campaign_id` - ID of the campaign for the UC pair
/// * `state` - current app state
/// * `transaction` - the transaction
///
/// # Returns
/// Returns a `Result` containing either
/// * `Ok(i64)` - the uc id
/// * `Err(ChaosError)` - If no availabilities are found

async fn get_or_create_uc_id(
    user_id: i64,
    campaign_id: i64,
    state: &mut AppState,
    transaction: &mut DBTransaction<'_>,
) -> Result<i64, ChaosError> {
    let uc_id_res =
        Availabilities::get_user_campaign_id(user_id, campaign_id, &mut transaction.tx).await;
    Ok(match uc_id_res {
        Err(_) => {
            Availabilities::create_user_campaign_availability(
                user_id,
                campaign_id,
                &mut state.snowflake_generator,
                &mut transaction.tx,
            )
            .await?
        }
        Ok(uc) => uc.id,
    })
}

impl AvailabilitiesHandler {
    // TODO: change auth_user to an availabilities specific extractor

    /// Retrieves all availability slots for a given user_id and campaign_id
    ///
    /// # Arguments
    ///
    /// * `user_id` - ID of the interviewer
    /// * `campaign_id` - ID of the campaign in which the user will be interviewing
    /// * `state` - The application state
    /// * `_auth_user` - The authenticated user
    /// * `transaction` - Database transaction
    ///
    /// # Returns
    /// Returns a `Result` containing either
    /// * `Ok(Vec<Availability>)` - Vec of availabilities
    /// * `Err(ChaosError)` - If no availabilities are found

    pub async fn get(
        Path((user_id, campaign_id)): Path<(i64, i64)>,
        State(mut state): State<AppState>,
        _auth_user: AuthUser,
        mut transaction: DBTransaction<'_>,
    ) -> Result<impl IntoResponse, ChaosError> {
        let uc_id = get_or_create_uc_id(user_id, campaign_id, &mut state, &mut transaction).await?;

        let res = Availabilities::get_availability_slots(uc_id, &mut transaction.tx).await?;

        transaction.tx.commit().await?;

        Ok((
            StatusCode::OK,
            Json(AvailabilitiesMessage {
                availabilities: res,
            }),
        ))
    }

    // TODO: change auth_user to an availabilities specific extractor

    /// Modifies availabilities for a given user in a campaign
    ///
    /// # Arguments
    ///
    /// * `user_id` - ID of the interviewer
    /// * `campaign_id` - ID of the campaign in which the user will be interviewing
    /// * `state` - The application state
    /// * `availabilities` - the set of ALL availabilities the user now has
    /// * `_auth_user` - The authenticated user
    /// * `transaction` - Database transaction
    ///
    /// # Returns
    /// Returns a `Result` containing either
    /// * `Ok(())` - If successful
    /// * `Err(ChaosError)` - Otherwise

    pub async fn update(
        Path((user_id, campaign_id)): Path<(i64, i64)>,
        State(mut state): State<AppState>,
        _auth_user: AuthUser,
        mut transaction: DBTransaction<'_>,
        Json(availabilities): Json<Vec<Availability>>,
    ) -> Result<impl IntoResponse, ChaosError> {
        let uc_id = get_or_create_uc_id(user_id, campaign_id, &mut state, &mut transaction).await?;

        let curr_availabilities =
            Availabilities::get_availability_slots(uc_id, &mut transaction.tx).await?;

        // Diff is determined by assuming all current timeslots are to be deleted and none are to be added
        // Since if any availability slot is passed in, then it will either be added (if not already in the db)
        // or it won't be removed (if it is already in the db)
        let mut to_delete: HashSet<Availability> = curr_availabilities.into_iter().collect();
        let mut to_add: Vec<Availability> = Vec::new();

        availabilities.into_iter().for_each(|a| {
            if !to_delete.contains(&a) {
                to_add.push(a);
            } else {
                to_delete.remove(&a);
            }
        });

        Availabilities::delete_availabilities(
            user_id,
            campaign_id,
            to_delete.into_iter().collect(),
            &mut transaction.tx,
        )
        .await?;

        Availabilities::create_availability_slots(uc_id, to_add, &mut transaction.tx).await?;

        transaction.tx.commit().await?;
        Ok(AppMessage::OkMessage("Successfully updated availabilities"))
    }
}
