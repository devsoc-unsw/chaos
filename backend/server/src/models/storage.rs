use crate::models::error::ChaosError;
use s3::creds::Credentials;
use s3::{Bucket, BucketConfiguration, Region};
use std::env;

pub struct Storage;

impl Storage {
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

        let bucket = Bucket::new(&*bucket_name, region, credentials).unwrap();
        // TODO: Change depending on style used by provider
        // bucket.set_path_style();

        bucket
    }

    pub async fn generate_put_url(path: String, bucket: &Bucket) -> Result<String, ChaosError> {
        let url = bucket.presign_put(path, 3600, None).await?;

        Ok(url)
    }
}
