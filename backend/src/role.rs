use crate::database::{
    models::{Role, User},
    Database,
};
use rocket::{
    get,
    serde::{
        json::{Json, Value},
        Serialize,
    },
};

#[derive(Serialize)]
pub enum RoleError {
    RoleNotFound,
}

#[derive(Serialize)]
pub struct RoleResponse {
    name: String,
    description: Description,
    min_available: i32,
    max_available: i32,
}

#[derive(Serialize)]
enum Description {
    Str(String),
    Null(Value),
}

// returns a JSON null or string depending on Option
fn check_null(desc: Option<String>) -> Description {
    match desc {
        Some(desc_) => Description::Str(desc_),
        None => Description::Null(Value::Null),
    }
}

#[get("/<role_id>")]
pub async fn get_role(
    role_id: i32,
    _user: User,
    db: Database,
) -> Result<Json<RoleResponse>, Json<RoleError>> {
    let res: Option<Role> = db.run(move |conn| Role::get_from_id(&conn, role_id)).await;

    match res {
        Some(role_) => Ok(Json(RoleResponse {
            name: role_.name,
            description: check_null(role_.description),
            min_available: role_.min_available,
            max_available: role_.max_available,
        })),
        None => Err(Json(RoleError::RoleNotFound)),
    }
}
