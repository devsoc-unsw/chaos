//! S3-compatible storage integration for Chaos.
//! 
//! This module provides functionality for interacting with S3-compatible storage services.
//! It handles bucket initialization and URL generation for file uploads.

use crate::models::error::ChaosError;
use s3::creds::Credentials;
use s3::{Bucket, Region};
use serde::Serialize;
use std::env;
use uuid::Uuid;

/// Storage service for handling S3-compatible storage operations.
/// 
/// This struct provides methods for initializing S3 bucket connections and
/// generating pre-signed URLs for file uploads.
pub struct Storage;

impl Storage {
    /// Initializes a new S3 bucket connection using environment variables.
    /// 
    /// # Environment Variables
    /// * `S3_BUCKET_NAME` - The name of the S3 bucket
    /// * `S3_ACCESS_KEY` - The access key for S3 authentication
    /// * `S3_SECRET_KEY` - The secret key for S3 authentication
    /// * `S3_ENDPOINT` - The endpoint URL for the S3 service
    /// * `S3_REGION_NAME` - The region name for the S3 service
    /// 
    /// # Returns
    /// Returns a configured `Bucket` instance for S3 operations.
    /// 
    /// # Panics
    /// Panics if any of the required environment variables are not set.
    pub fn init_bucket() -> Bucket {
        let bucket_name = env::var("S3_BUCKET_NAME")
            .expect("Error getting S3 BUCKET NAME")
            .to_string();
        let access_key = env::var("S3_ACCESS_KEY")
            .expect("Error getting S3 CREDENTIALS")
            .to_string();
        let secret_key = env::var("S3_SECRET_KEY")
            .expect("Error getting S3 CREDENTIALS")
            .to_string();
        let endpoint = env::var("S3_ENDPOINT")
            .expect("Error getting S3 ENDPOINT")
            .to_string();
        let region_name = env::var("S3_REGION_NAME")
            .expect("Error getting S3 REGION NAME")
            .to_string();

        let credentials = Credentials::new(
            Option::from(access_key.as_str()),
            Option::from(secret_key.as_str()),
            None,
            None,
            None,
        )
        .unwrap();

        let region = Region::Custom {
            region: region_name,
            endpoint,
        };

        let mut bucket = Bucket::new(&bucket_name, region, credentials).unwrap();
        // Enable path-style URLs for R2 compatibility
        bucket.set_path_style();

        bucket
    }

    /// Generates a pre-signed URL for uploading a file to S3.
    /// 
    /// # Arguments
    /// * `path` - The path where the file will be stored in the bucket
    /// * `bucket` - A reference to the initialized S3 bucket
    /// 
    /// # Returns
    /// Returns a `Result` containing either:
    /// * `Ok(String)` - The pre-signed URL for uploading
    /// * `Err(ChaosError)` - An error if URL generation fails
    /// 
    /// # Note
    /// The generated URL is valid for 1 hour (3600 seconds).
    pub async fn generate_put_url(path: String, bucket: &Bucket) -> Result<String, ChaosError> {
        let url = bucket.presign_put(path, 3600 * 24, None).await?;

        Ok(url)
    }

    /// Generates a pre-signed URL for uploading an organisation image to S3.
    ///
    /// # Arguments
    /// * `organisation_id` - The ID of the organisation that owns the image
    /// * `image_id` - The ID of the image to upload
    /// * `bucket` - A reference to the initialized S3 bucket
    ///
    /// # Returns
    /// * `Ok(String)` - Presigned PUT URL valid for 24 hours
    /// * `Err(ChaosError)` - If URL generation fails
    pub async fn generate_organisation_image_upload_url(
        organisation_id: i64,
        image_id: Option<Uuid>,
        bucket: &Bucket,
    ) -> Result<OrganisationImageUploadUrl, ChaosError> {
        let image_id = image_id.unwrap_or_else(Uuid::new_v4);
        let path = format!("organisations/{}/images/{}", organisation_id, image_id);
        let upload_url = bucket.presign_put(path, 3600 * 24, None).await?;

        Ok(OrganisationImageUploadUrl {
            image_id,
            upload_url,
        })
    }

    /// Generates a pre-signed URL for uploading a user image to S3.
    /// 
    /// # Arguments
    /// * `user_id` - The ID of the user who owns the image
    /// * `image_id` - The ID of the image to upload
    /// * `bucket` - A reference to the initialized S3 bucket
    /// 
    /// # Returns
    /// Returns a `Result` containing either:
    /// * `Ok(String)` - The pre-signed URL for uploading the image
    /// * `Err(ChaosError)` - An error if URL generation fails
    /// 
    /// # Note
    /// The generated URL is valid for 1 hour (3600 seconds).
    /// The image path format is: `/users/{user_id}/images/{image_id}`
    /// When uploading, use this exact path as the object key (filename doesn't matter).
    pub async fn generate_user_image_upload_url(
        user_id: i64,
        image_id: i64,
        bucket: &Bucket,
    ) -> Result<String, ChaosError> {
        // No leading slash for path-style URLs
        let path = format!("users/{}/images/{}", user_id, image_id);
        let url = bucket.presign_put(path, 3600, None).await?;

        Ok(url)
    }

    /// Generates a pre-signed URL for retrieving a user image from S3.
    /// 
    /// This function searches for an image file at `/users/{user_id}/images/{image_id}` 
    /// and supports any image file type (.png, .jpeg, .jpg, .gif, .webp, etc.).
    /// It will find the first non-thumbnail file in that location.
    /// 
    /// # Arguments
    /// * `user_id` - The ID of the user who owns the image
    /// * `image_id` - The ID of the image to retrieve
    /// * `bucket` - A reference to the initialized S3 bucket
    /// 
    /// # Returns
    /// Returns a `Result` containing either:
    /// * `Ok(String)` - The pre-signed URL for retrieving the image
    /// * `Err(ChaosError)` - An error if the image is not found or URL generation fails
    /// 
    /// # Note
    /// The generated URL is valid for 24 hours (86400 seconds).
    /// The function searches for files in `/users/{user_id}/images/{image_id}/` and 
    /// returns the first non-thumbnail file found, regardless of file extension.
    pub async fn get_user_image_url(
        user_id: i64,
        image_id: i64,
        bucket: &Bucket,
    ) -> Result<String, ChaosError> {
        let base_path = format!("users/{}/images/{}", user_id, image_id);
        Self::get_image_url_for_prefix(bucket, &base_path, || {
            format!("Image not found at /users/{}/images/{}", user_id, image_id)
        })
        .await
    }

    /// Generates a pre-signed URL for retrieving an organisation image from S3.
    ///
    /// Looks for files stored under `/organisations/{organisation_id}/images/{image_id}`
    /// and supports the same fallback strategy as user images.
    pub async fn get_organisation_image_url(
        organisation_id: i64,
        image_id: Uuid,
        bucket: &Bucket,
    ) -> Result<String, ChaosError> {
        let base_path = format!("organisations/{}/images/{}", organisation_id, image_id);
        Self::get_image_url_for_prefix(bucket, &base_path, || {
            format!(
                "Image not found at /organisations/{}/images/{}",
                organisation_id, image_id
            )
        })
        .await
    }
}

impl Storage {
    async fn get_image_url_for_prefix(
        bucket: &Bucket,
        base_path: &str,
        not_found_msg: impl FnOnce() -> String,
    ) -> Result<String, ChaosError> {
        if let Some(url) = Self::presign_if_object_exists(bucket, base_path).await {
            return Ok(url);
        }

        let common_extensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
        for ext in &common_extensions {
            let candidate = format!("{}{}", base_path, ext);
            if let Some(url) = Self::presign_if_object_exists(bucket, &candidate).await {
                return Ok(url);
            }
        }

        let prefix = format!("{}/", base_path);
        let delimiter = Some("/".to_string());

        if let Ok(list_result) = bucket.list(prefix.clone(), delimiter).await {
            for page in list_result {
                for object in page.contents {
                    let key = object.key;
                    if !key.contains("thumbnail") {
                        let url = bucket.presign_get(key.clone(), 86400, None).await?;
                        return Ok(url);
                    }
                }
            }
        }

        Err(ChaosError::BadRequestWithMessage(not_found_msg()))
    }

    async fn presign_if_object_exists(bucket: &Bucket, key: &str) -> Option<String> {
        if Self::object_exists(bucket, key).await {
            if let Ok(url) = bucket.presign_get(key.to_string(), 86400, None).await {
                return Some(url);
            }
        }
        None
    }

    async fn object_exists(bucket: &Bucket, key: &str) -> bool {
        match bucket.list(key.to_string(), None).await {
            Ok(results) => results
                .into_iter()
                .flat_map(|page| page.contents.into_iter())
                .any(|object| object.key == key),
            Err(_) => false,
        }
    }
}

/// Response payload for organisation image uploads.
#[derive(Serialize)]
pub struct OrganisationImageUploadUrl {
    pub image_id: Uuid,
    pub upload_url: String,
}
