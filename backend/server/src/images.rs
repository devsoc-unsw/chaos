use image::{io::Reader as ImageReader, DynamicImage, ImageError};
use rocket::{data::ToByteUnit, Data};
use std::{
    fs,
    io::{self, Cursor},
    path::{Path, PathBuf},
};
use strum::{EnumIter, IntoEnumIterator};

pub enum ImageDecodeError {
    ImageError(ImageError),
    IoError(io::Error),
}

impl From<ImageError> for ImageDecodeError {
    fn from(error: ImageError) -> Self {
        ImageDecodeError::ImageError(error)
    }
}

impl From<io::Error> for ImageDecodeError {
    fn from(error: io::Error) -> Self {
        ImageDecodeError::IoError(error)
    }
}

pub fn try_decode_bytes(bytes: Vec<u8>) -> Result<DynamicImage, ImageError> {
    ImageReader::new(Cursor::new(bytes))
        .with_guessed_format()?
        .decode()
}

#[rustfmt::skip]
pub async fn try_decode_data(data: Data<'_>) -> Result<DynamicImage, ImageDecodeError> {
    data.open(5.mebibytes()).into_bytes().await.map(|bytes| try_decode_bytes(bytes.to_vec())).map_err(|e| e.into()).and_then(|v| v.map_err(|e| e.into()))
}

const HTTP_IMAGE_BASE_PATH: &str = "/api/static/images/";
pub const IMAGE_BASE_PATH: &str = "./images/";

#[derive(EnumIter)]
pub enum ImageLocation {
    CAMPAIGNS,
    ORGANISATIONS,
}

pub fn image_location_to_string(location: ImageLocation) -> String {
    match location {
        ImageLocation::CAMPAIGNS => "campaigns/",
        ImageLocation::ORGANISATIONS => "organisations/",
    }
    .to_string()
}

pub fn save_image(
    image: DynamicImage,
    location: ImageLocation,
    image_uuid: &str,
) -> Result<PathBuf, ImageError> {
    ImageLocation::iter().for_each(|location| {
        fs::create_dir_all(Path::new(IMAGE_BASE_PATH).join(image_location_to_string(location)))
            .ok();
    });

    let path = get_image_path(location, image_uuid);

    match image.save_with_format(&path, image::ImageFormat::Png) {
        Ok(_) => Ok(path),
        Err(e) => Err(e),
    }
}

pub fn get_image_path(location: ImageLocation, image_uuid: &str) -> PathBuf {
    Path::new(IMAGE_BASE_PATH)
        .join(image_location_to_string(location))
        .join(image_uuid)
}

pub fn get_http_image_path(location: ImageLocation, image_uuid: &str) -> String {
    Path::new(HTTP_IMAGE_BASE_PATH)
        .join(image_location_to_string(location))
        .join(image_uuid)
        .to_str()
        .unwrap()
        .to_string()
}
