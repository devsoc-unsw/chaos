use crate::models;
use crate::models::app::AppState;
use crate::models::auth::SuperUser;
use crate::models::auth::{AuthUser, OrganisationAdmin};
use crate::models::error::ChaosError;
use crate::models::organisation::{AdminToRemove, AdminUpdateList, NewOrganisation, Organisation};
use crate::models::transaction::DBTransaction;
use crate::models::response::Response200;
use crate::service;
use axum::extract::{Json, Path, State};
use axum::http::StatusCode;
use aide::axum::IntoApiResponse;


pub struct OrganisationHandler;

impl OrganisationHandler {
    pub async fn create(
        State(state): State<AppState>,
        _user: SuperUser,
        mut transaction: DBTransaction<'_>,
        Json(data): Json<NewOrganisation>,
    ) -> Result<impl IntoApiResponse, ChaosError> {
        Organisation::create(
            data.admin,
            data.name,
            state.snowflake_generator,
            &mut transaction.tx,
        )
        .await?;

        transaction.tx.commit().await?;
		Ok(Response200::<"Succesfully created organisation"> {})
    }

    pub async fn get(
        State(state): State<AppState>,
        Path(id): Path<i64>,
        _user: AuthUser,
    ) -> Result<impl IntoApiResponse, ChaosError> {
        let org = Organisation::get(id, &state.db).await?;
        Ok((StatusCode::OK, Json(org)))
    }

    pub async fn delete(
        State(state): State<AppState>,
        Path(id): Path<i64>,
        _user: SuperUser,
    ) -> Result<impl IntoApiResponse, ChaosError> {
        Organisation::delete(id, &state.db).await?;
		Ok(Response200::<"Succesfully deleted organisation"> {})
    }

    pub async fn get_admins(
        State(state): State<AppState>,
        Path(id): Path<i64>,
        _user: SuperUser,
    ) -> Result<impl IntoApiResponse, ChaosError> {
        let members = Organisation::get_admins(id, &state.db).await?;
        Ok((StatusCode::OK, Json(members)))
    }

    pub async fn get_members(
        State(state): State<AppState>,
        Path(id): Path<i64>,
        _admin: OrganisationAdmin,
    ) -> Result<impl IntoApiResponse, ChaosError> {
        let members = Organisation::get_members(id, &state.db).await?;
        Ok((StatusCode::OK, Json(members)))
    }

    pub async fn update_admins(
        State(state): State<AppState>,
        Path(id): Path<i64>,
        _super_user: SuperUser,
        mut transaction: DBTransaction<'_>,
        Json(request_body): Json<AdminUpdateList>,
    ) -> Result<impl IntoApiResponse, ChaosError> {
        Organisation::update_admins(id, request_body.members, &mut transaction.tx).await?;

        transaction.tx.commit().await?;
		Ok(Response200::<"Successfully updated organisation members"> {})
    }

    pub async fn update_members(
        State(state): State<AppState>,
        mut transaction: DBTransaction<'_>,
        Path(id): Path<i64>,
        _admin: OrganisationAdmin,
        Json(request_body): Json<AdminUpdateList>,
    ) -> Result<impl IntoApiResponse, ChaosError> {
        Organisation::update_members(id, request_body.members, &mut transaction.tx).await?;

        transaction.tx.commit().await?;
		Ok(Response200::<"Successfully updated organisation members"> {})
    }

    pub async fn remove_admin(
        State(state): State<AppState>,
        Path(id): Path<i64>,
        _super_user: SuperUser,
        Json(request_body): Json<AdminToRemove>,
    ) -> Result<impl IntoApiResponse, ChaosError> {
        Organisation::remove_admin(id, request_body.user_id, &state.db).await?;

		Ok(Response200::<"Successfully removed member from organisation"> {})
    }

    pub async fn remove_member(
        State(state): State<AppState>,
        Path(id): Path<i64>,
        _admin: OrganisationAdmin,
        Json(request_body): Json<AdminToRemove>,
    ) -> Result<impl IntoApiResponse, ChaosError> {
        Organisation::remove_member(id, request_body.user_id, &state.db).await?;

		Ok(Response200::<"Successfully removed member from organisation"> {})
    }

    pub async fn update_logo(
        State(state): State<AppState>,
        Path(id): Path<i64>,
        _admin: OrganisationAdmin,
    ) -> Result<impl IntoApiResponse, ChaosError> {
        let logo_url = Organisation::update_logo(id, &state.db, &state.storage_bucket).await?;
        Ok((StatusCode::OK, Json(logo_url)))
    }

    pub async fn get_campaigns(
        State(state): State<AppState>,
        Path(id): Path<i64>,
        _user: AuthUser,
    ) -> Result<impl IntoApiResponse, ChaosError> {
        let campaigns = Organisation::get_campaigns(id, &state.db).await?;

        Ok((StatusCode::OK, Json(campaigns)))
    }

    pub async fn create_campaign(
        State(mut state): State<AppState>,
        _admin: OrganisationAdmin,
        Json(request_body): Json<models::campaign::Campaign>,
    ) -> Result<impl IntoApiResponse, ChaosError> {
        Organisation::create_campaign(
            request_body.name,
            request_body.description,
            request_body.starts_at,
            request_body.ends_at,
            &state.db,
            &mut state.snowflake_generator,
        )
        .await?;

		Ok(Response200::<"Successfully created campaign"> {})
    }
}
