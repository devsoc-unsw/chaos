use crate::models;
use crate::models::app::AppState;
use crate::models::auth::{AuthUser, OrganisationAdmin};
use crate::models::auth::SuperUser;
use crate::models::error::ChaosError;
use crate::models::organisation::{AdminToRemove, AdminUpdateList, NewOrganisation, Organisation};
use crate::models::transaction::DBTransaction;
use crate::service;
use axum::extract::{Json, Path, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;

pub struct OrganisationHandler;

impl OrganisationHandler {
    pub async fn create(
        State(state): State<AppState>,
        _user: SuperUser,
        mut transaction: DBTransaction<'_>,
        Json(data): Json<NewOrganisation>,
    ) -> Result<impl IntoResponse, ChaosError> {
        Organisation::create(
            data.admin,
            data.name,
            state.snowflake_generator,
            &mut transaction.tx,
        )
            .await?;

        transaction.tx.commit().await?;
        Ok((StatusCode::OK, "Successfully created organisation"))
    }

    pub async fn get(
        State(state): State<AppState>,
        Path(organisation_id): Path<i64>,
        _user: AuthUser,
    ) -> Result<impl IntoResponse, ChaosError> {
        let org = Organisation::get(organisation_id, &state.db).await?;
        Ok((StatusCode::OK, Json(org)))
    }

    pub async fn delete(
        State(state): State<AppState>,
        Path(organisation_id): Path<i64>,
        _user: SuperUser,
    ) -> Result<impl IntoResponse, ChaosError> {
        Organisation::delete(organisation_id, &state.db).await?;
        Ok((StatusCode::OK, "Successfully deleted organisation"))
    }

    pub async fn get_members(
        State(state): State<AppState>,
        Path(organisation_id): Path<i64>,
        _admin: OrganisationAdmin,
    ) -> Result<impl IntoResponse, ChaosError> {
        let members =
            Organisation::get_members(organisation_id, &state.db)
                .await?;
        Ok((StatusCode::OK, Json(members)))
    }

    pub async fn update_admins(
        mut transaction: DBTransaction<'_>,
        Path(organisation_id): Path<i64>,
        Json(request_body): Json<AdminUpdateList>,
        _super_user: SuperUser,
    ) -> Result<impl IntoResponse, ChaosError> {
        Organisation::update_admins(
            organisation_id,
            request_body.members,
            &mut transaction.tx,
        )
            .await?;

        transaction.tx.commit().await?;
        Ok((StatusCode::OK, "Successfully updated organisation members"))
    }

    pub async fn update_members(
        mut transaction: DBTransaction<'_>,
        Path(organisation_id): Path<i64>,
        Json(request_body): Json<AdminUpdateList>,
        _admin: OrganisationAdmin,
    ) -> Result<impl IntoResponse, ChaosError> {
        Organisation::update_members(
            organisation_id,
            request_body.members,
            &mut transaction.tx,
        )
            .await?;

        transaction.tx.commit().await?;
        Ok((StatusCode::OK, "Successfully updated organisation members"))
    }

    pub async fn remove_admin(
        State(state): State<AppState>,
        Path(organisation_id): Path<i64>,
        _super_user: SuperUser,
        Json(request_body): Json<AdminToRemove>,
    ) -> Result<impl IntoResponse, ChaosError> {
        Organisation::remove_admin(
            organisation_id,
            request_body.user_id,
            &state.db,
        )
            .await?;

        Ok((
            StatusCode::OK,
            "Successfully removed member from organisation",
        ))
    }

    pub async fn remove_member(
        State(state): State<AppState>,
        Path(organisation_id): Path<i64>,
        _admin: OrganisationAdmin,
        Json(request_body): Json<AdminToRemove>,
    ) -> Result<impl IntoResponse, ChaosError> {
        Organisation::remove_member(
            organisation_id,
            request_body.user_id,
            &state.db,
        )
            .await?;

        Ok((
            StatusCode::OK,
            "Successfully removed member from organisation",
        ))
    }

    pub async fn update_logo(
        State(state): State<AppState>,
        Path(organisation_id): Path<i64>,
        _admin: OrganisationAdmin,
    ) -> Result<impl IntoResponse, ChaosError> {
        let logo_url =
            Organisation::update_logo(organisation_id, &state.db)
                .await?;
        Ok((StatusCode::OK, Json(logo_url)))
    }

    pub async fn get_campaigns(
        State(state): State<AppState>,
        Path(organisation_id): Path<i64>,
        _user: AuthUser,
    ) -> Result<impl IntoResponse, ChaosError> {
        let campaigns =
            Organisation::get_campaigns(organisation_id, &state.db).await?;

        Ok((StatusCode::OK, Json(campaigns)))
    }

    pub async fn create_campaign(
        State(mut state): State<AppState>,
        _admin: OrganisationAdmin,
        Json(request_body): Json<models::campaign::Campaign>,
    ) -> Result<impl IntoResponse, ChaosError> {
        Organisation::create_campaign(
            request_body.name,
            request_body.description,
            request_body.starts_at,
            request_body.ends_at,
            &state.db,
            &mut state.snowflake_generator
        )
            .await?;

        Ok((StatusCode::OK, "Successfully created campaign"))
    }
}
