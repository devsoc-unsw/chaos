use super::Pool;
use std::ops::Deref;
use rocket::{
    http::Status,
    request::Outcome,
    outcome::try_outcome,
    request::FromRequest,
    State,
};
use diesel::{
    PgConnection,
    r2d2::{PooledConnection, ConnectionManager},
};

pub struct Connection(PooledConnection<ConnectionManager<PgConnection>>);

#[rocket::async_trait]
impl<'r> FromRequest<'r> for Connection {
    type Error = ();

    async fn from_request(request: &'r rocket::Request<'_>) -> Outcome<Self, Self::Error> {
        let pool = try_outcome!(request.guard::<&State<Pool>>().await);
        match pool.get() {
            Ok(connection) => Outcome::Success(Connection(connection)),
            Err(_) => Outcome::Failure((Status::ServiceUnavailable, ()))
        }
    }
}

impl Deref for Connection {
    type Target = PgConnection;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}
