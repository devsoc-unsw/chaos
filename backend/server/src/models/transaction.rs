use crate::models::app::AppState;
use crate::models::error::ChaosError;
use axum::async_trait;
use axum::extract::{FromRef, FromRequestParts};
use axum::http::request::Parts;
use sqlx::{Postgres, Transaction};

pub struct DBTransaction<'a> {
    pub tx: Transaction<'a, Postgres>,
}

#[async_trait]
impl<S> FromRequestParts<S> for DBTransaction<'_>
where
    AppState: FromRef<S>,
    S: Send + Sync,
{
    type Rejection = ChaosError;

    async fn from_request_parts(_: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let app_state = AppState::from_ref(state);

        Ok(DBTransaction {
            tx: app_state.db.begin().await?,
        })
    }
}
