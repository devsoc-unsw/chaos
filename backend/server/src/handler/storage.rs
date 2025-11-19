//! Storage handler for generating presigned upload/download URLs.
//!
//! These endpoints allow the frontend to get short-lived URLs without exposing
//! access keys directly to clients.

use crate::models::app::AppState;
use crate::models::error::ChaosError;
use crate::models::storage::Storage;
use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::Json;

/// Handler for storage-related HTTP requests.
pub struct StorageHandler;

impl StorageHandler {
    /// Retrieves a presigned URL for a user's image (valid for 24 hours).
    pub async fn get_image_url(
        State(state): State<AppState>,
        Path((user_id, image_id)): Path<(i64, i64)>,
    ) -> Result<impl IntoResponse, ChaosError> {
        let url =
            Storage::get_user_image_url(user_id, image_id, &state.storage_bucket).await?;

        #[derive(serde::Serialize)]
        struct ImageUrlResponse {
            url: String,
        }

        Ok((StatusCode::OK, Json(ImageUrlResponse { url })))
    }

    /// Generates a presigned URL for uploading a user's image (valid for 1 hour).
    pub async fn get_image_upload_url(
        State(state): State<AppState>,
        Path((user_id, image_id)): Path<(i64, i64)>,
    ) -> Result<impl IntoResponse, ChaosError> {
        let url = Storage::generate_user_image_upload_url(
            user_id,
            image_id,
            &state.storage_bucket,
        )
        .await?;

        #[derive(serde::Serialize)]
        struct ImageUrlResponse {
            url: String,
        }

        Ok((StatusCode::OK, Json(ImageUrlResponse { url })))
    }
}