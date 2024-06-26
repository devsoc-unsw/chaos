use crate::models;
use crate::models::app::AppState;
use crate::models::auth::{AuthUser, OrganisationAdmin};
use crate::models::auth::SuperUser;
use crate::models::organisation::{AdminToRemove, AdminUpdateList, NewOrganisation};
use crate::service;
use axum::extract::{Json, Path, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;
use crate::models::error::ChaosError;

pub async fn get_organisation(
    State(state): State<AppState>,
    Path(organisation_id): Path<i64>,
) -> Result<impl IntoResponse, ChaosError> {
    let org = service::organisation::get_organisation(organisation_id, &state.db).await?;
    Ok((StatusCode::OK, Json(org)))
}

pub async fn update_organisation_logo(
    State(state): State<AppState>,
    Path(organisation_id): Path<i64>,
    admin: OrganisationAdmin,
) -> Result<impl IntoResponse, ChaosError> {
    let logo_url = service::organisation::update_organisation_logo(organisation_id, admin.user_id, &state.db).await?;
    Ok((StatusCode::OK, Json(logo_url)))
}

pub async fn delete_organisation(
    State(state): State<AppState>,
    Path(organisation_id): Path<i64>,
    _user: SuperUser,
) -> Result<impl IntoResponse, ChaosError> {
    service::organisation::delete_organisation(organisation_id, &state.db).await?;
    Ok((StatusCode::OK, "Successfully deleted organisation"))
}

pub async fn create_organisation(
    State(state): State<AppState>,
    _user: SuperUser,
    Json(data): Json<NewOrganisation>,
) -> Result<impl IntoResponse, ChaosError> {
    let mut transaction = state.db.begin().await?;

    match service::organisation::create_organisation(
        data.admin,
        data.name,
        state.snowflake_generator,
        &mut transaction,
    )
    .await {
        Ok(..) => {
            transaction.commit().await?;
            Ok((StatusCode::OK, "Successfully created organisation"))
        },
        Err(err) => {
            transaction.rollback().await?;
            Err(err)
        }
    }
}

pub async fn get_organisation_members(
    State(state): State<AppState>,
    Path(organisation_id): Path<i64>,
    admin: OrganisationAdmin,
) -> Result<impl IntoResponse, ChaosError> {
    let members = service::organisation::get_organisation_members(organisation_id, admin.user_id, &state.db).await?;
    Ok((StatusCode::OK, Json(members)))
}

pub async fn update_organisation_admins(
    State(state): State<AppState>,
    Path(organisation_id): Path<i64>,
    Json(request_body): Json<AdminUpdateList>,
    admin: OrganisationAdmin,
) -> Result<impl IntoResponse, ChaosError> {
    service::organisation::update_organisation_admins(
        organisation_id,
        admin.user_id,
        request_body.members,
        &state.db,
    )
    .await?;

    Ok((StatusCode::OK, "Successfully updated organisation admins"))
}

pub async fn remove_admin_from_organisation(
    State(state): State<AppState>,
    Path(organisation_id): Path<i64>,
    admin: OrganisationAdmin,
    Json(request_body): Json<AdminToRemove>,
) -> Result<impl IntoResponse, ChaosError> {
    service::organisation::remove_admin_from_organisation(
        organisation_id,
        admin.user_id,
        request_body.user_id,
        &state.db,
    )
    .await?;

    Ok((StatusCode::OK, "Successfully removed admin from organisation"))
}

pub async fn get_organisation_campaigns(
    State(state): State<AppState>,
    Path(organisation_id): Path<i64>,
) -> Result<impl IntoResponse, ChaosError> {
    let campaigns = service::organisation::get_organisation_campaigns(organisation_id, &state.db).await?;

    Ok((StatusCode::OK, Json(campaigns)))
}

pub async fn create_campaign_for_organisation(
    State(state): State<AppState>,
    _user: SuperUser,
    Json(request_body): Json<models::campaign::Campaign>,
) -> Result<impl IntoResponse, ChaosError> {
    let mut snowflake_generator = state.snowflake_generator;
    let new_campaign_id = snowflake_generator.real_time_generate();

    service::organisation::create_campaign_for_organisation(
        new_campaign_id,
        request_body.name,
        request_body.description,
        request_body.starts_at,
        request_body.ends_at,
        &state.db,
    )
    .await?;

    Ok((StatusCode::OK, "Successfully created campaign"))
}
