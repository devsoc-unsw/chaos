use crate::models::app::AppState;
use crate::models::auth::{OfferAdmin, OfferRecipient};
use crate::models::error::ChaosError;
use crate::models::offer::{Offer, OfferReply};
use crate::models::transaction::DBTransaction;
use axum::extract::{Json, Path, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;

pub struct OfferHandler;
impl OfferHandler {
    pub async fn get(
        mut transaction: DBTransaction<'_>,
        Path(id): Path<i64>,
        _user: OfferAdmin,
    ) -> Result<impl IntoResponse, ChaosError> {
        let offer = Offer::get(id, &mut transaction.tx).await?;
        transaction.tx.commit().await?;

        Ok((StatusCode::OK, Json(offer)))
    }

    pub async fn delete(
        mut transaction: DBTransaction<'_>,
        Path(id): Path<i64>,
        _user: OfferAdmin,
    ) -> Result<impl IntoResponse, ChaosError> {
        Offer::delete(id, &mut transaction.tx).await?;
        transaction.tx.commit().await?;

        Ok((StatusCode::OK, "Successfully deleted offer"))
    }

    pub async fn reply(
        mut transaction: DBTransaction<'_>,
        Path(id): Path<i64>,
        _user: OfferRecipient,
        Json(reply): Json<OfferReply>,
    ) -> Result<impl IntoResponse, ChaosError> {
        Offer::reply(id, reply.accept, &mut transaction.tx).await?;
        transaction.tx.commit().await?;

        Ok((StatusCode::OK, "Successfully accepted offer"))
    }

    pub async fn preview_email(
        mut transaction: DBTransaction<'_>,
        Path(id): Path<i64>,
        _user: OfferAdmin,
    ) -> Result<impl IntoResponse, ChaosError> {
        let string = Offer::preview_email(id, &mut transaction.tx).await?;
        transaction.tx.commit().await?;

        Ok((StatusCode::OK, string))
    }

    pub async fn send_offer(
        mut transaction: DBTransaction<'_>,
        Path(id): Path<i64>,
        _user: OfferAdmin,
        State(state): State<AppState>,
    ) -> Result<impl IntoResponse, ChaosError> {
        Offer::send_offer(id, &mut transaction.tx, state.email_credentials).await?;
        transaction.tx.commit().await?;

        Ok((StatusCode::OK, "Successfully sent offer"))
    }
}
