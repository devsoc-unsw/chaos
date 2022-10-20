use std::io::Cursor;
use image::{Image, ImageReader};

pub fn convert_b64_image(bytes: Vec<u8>) -> Image {
    ImageReader::new(Cursor::new(bytes)).with_guessed_format()?.decode()?;
}

const IMAGE_BASE_PATH: String = "./images/";
const IMAGE_HTTP_PATH: String = "/images/";

pub enum ImageLocation {
    CAMPAIGNS,
    ORGANISATIONS
}

//TODO make these functions return results and handle errors gracefully
pub fn save_image(image: Image, location: ImageLocation, id: i32) -> String {
    let path = IMAGE_BASE_PATH;
    let path = path + match location {
        CAMPAIGNS => "campaigns/",
        ORGANISATIONS => "organisations/"
    };
    let path = path + id.to_string();

    image.save(path)?;
    
    return path;
}

pub fn get_image_path(location: ImageLocation, id: i32) -> String {
    let path = IMAGE_BASE_PATH;
    let path = path + match location {
        CAMPAIGNS => "campaigns/",
        ORGANISATIONS => "organisations/"
    };
    let path = path + id.to_string();

    return path;
}

pub fn get_image_http_path(location: ImageLocation, id: i32) -> String {
    let path = IMAGE_HTTP_PATH;
    let path = path + match location {
        CAMPAIGNS => "campaigns/",
        ORGANISATIONS => "organisations/"
    };
    let path = path + id.to_string();

    return path;
}