use rocket::{
    http::Status,
    request::{self, FromRequest, Outcome},
    Request,
};

use crate::{
    auth::{Auth, AuthError},
    database::{
        models::{SuperUser, User},
        Database,
    },
};

#[derive(Debug)]
pub enum UserError {
    AuthError(AuthError),
    AccountNoLongerExists,
}

#[rocket::async_trait]
impl<'r> FromRequest<'r> for User {
    type Error = UserError;

    async fn from_request(request: &'r Request<'_>) -> request::Outcome<Self, Self::Error> {
        let auth = match request.guard::<Auth>().await {
            Outcome::Success(auth) => auth,
            Outcome::Failure((status, error)) => {
                return Outcome::Failure((status, UserError::AuthError(error)))
            }
            Outcome::Forward(forward) => return Outcome::Forward(forward),
        };

        let database = request.guard::<Database>().await.unwrap();

        let user_id = auth.jwt.user_id;
        let user = database
            .run(move |conn| User::get_from_id(conn, user_id as i32))
            .await;

        match user {
            Some(user) => Outcome::Success(user),
            None => Outcome::Failure((
                Status::InternalServerError,
                UserError::AccountNoLongerExists,
            )),
        }
    }
}

#[rocket::async_trait]
impl<'r> FromRequest<'r> for SuperUser {
    type Error = UserError;

    async fn from_request(request: &'r Request<'_>) -> request::Outcome<Self, Self::Error> {
        let auth = match request.guard::<Auth>().await {
            Outcome::Success(auth) => auth,
            Outcome::Failure((status, error)) => {
                return Outcome::Failure((status, UserError::AuthError(error)))
            }
            Outcome::Forward(forward) => return Outcome::Forward(forward),
        };

        let database = request.guard::<Database>().await.unwrap();

        let user_id = auth.jwt.user_id;
        let user = database
            .run(move |conn| User::get_from_id(conn, user_id as i32))
            .await;

        match user {
            Some(user) => {
                if user.superuser {
                    Outcome::Success(SuperUser::new(user))
                } else {
                    Outcome::Failure((
                        Status::Forbidden,
                        UserError::AuthError(AuthError::NotSuperUser),
                    ))
                }
            }
            None => Outcome::Failure((
                Status::InternalServerError,
                UserError::AccountNoLongerExists,
            )),
        }
    }
}
