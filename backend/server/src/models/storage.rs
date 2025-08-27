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

        let bucket = Bucket::new(&bucket_name, region, credentials).unwrap();
        // TODO: Change depending on style used by provider
        // bucket.set_path_style();

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
}
