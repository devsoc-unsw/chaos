use rocket::serde::{json::Json, Serialize};
use rocket::request::Request;
use rocket::response::{self, Responder};
use rocket::http::Status;

pub struct JsonErr<T: Serialize>(pub T, pub Status);

impl<'r, T: Serialize> Responder<'r, 'r> for JsonErr<T> {
    fn respond_to(self, r: &Request) -> response::Result<'r> {
        let json_self = Json(self.0);
        json_self.respond_to(r).map(|mut r| {
            r.set_status(self.1);
            r
        })
    }
}
