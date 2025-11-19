//! S3-compatible storage integration for Chaos.
//! 
//! This module provides functionality for interacting with S3-compatible storage services.
//! It handles bucket initialization and URL generation for file uploads.

use crate::models::error::ChaosError;
use s3::creds::Credentials;
use s3::{Bucket, Region};
use std::env;

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
        let url = bucket.presign_put(path, 3600, None).await?;

        Ok(url)
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
        // Base path without extension
        let base_path = format!("/users/{}/images/{}", user_id, image_id);
        
        // First, try common image extensions directly
        let common_extensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
        for ext in &common_extensions {
            let path_with_ext = format!("{}{}", base_path, ext);
            // Try to generate presigned URL - if it works, the file likely exists
            if let Ok(url) = bucket.presign_get(path_with_ext.clone(), 86400, None).await {
                return Ok(url);
            }
        }
        
        // If direct paths don't work, list objects in the directory (for files in subdirectory)
        let prefix = format!("/users/{}/images/{}/", user_id, image_id);
        let delimiter = Some("/".to_string());
        
        match bucket.list(prefix.clone(), delimiter).await {
            Ok(list_result) => {
                // Search through the listed objects
                for page in list_result {
                    for object in page.contents {
                        let key = object.key;
                        // Filter out thumbnails and find the first image file
                        if !key.contains("thumbnail") {
                            // Generate presigned URL valid for 24 hours (86400 seconds)
                            let url = bucket.presign_get(key.clone(), 86400, None).await?;
                            return Ok(url);
                        }
                    }
                }
            }
            Err(_) => {
                // Listing failed, continue to try exact path
            }
        }
        
        // Last resort: try the exact path without extension
        match bucket.presign_get(base_path.clone(), 86400, None).await {
            Ok(url) => Ok(url),
            Err(_) => Err(ChaosError::BadRequestWithMessage(
                format!("Image not found at /users/{}/images/{}", user_id, image_id)
            )),
        }
    }
}
