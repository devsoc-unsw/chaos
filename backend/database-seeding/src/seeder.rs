use std::fmt::Error;
use server::models::app::init_app_state;
use server::models::app::AppState;
use server::models::user::{User, UserRole};
use server::models::organisation::{Organisation};

use crate::seeder;

/// Struct which hold AppState that contains database connection
pub struct Seeder {
    pub app_state: AppState
}

pub async fn init() -> Seeder {
        let seeder = Seeder {
            app_state: init_app_state().await
        };

        seeder
    }

pub async fn seed_database(seeder: Seeder) {
    // Super User
    let root_user = User {
        id: 1,
        email: "admin@example.com".to_string(),
        zid: Some("z5555555".to_string()),
        name: "Francis Urquhart".to_string(),
        pronouns: Some("Ze/Za".to_string()),
        gender: Some("Otter".to_string()),
        degree_name: Some("Bachelor of Arts".to_string()),
        degree_starting_year: Some(1900),
        role: UserRole::SuperUser,
    };

    User::create_user(root_user, &seeder.app_state.db).await.expect("Failed seeding Root User");

    let org_id = Organisation::create(1, 
        "devsoc".to_string(), 
        "UNSW DevSoc".to_string(),
        seeder.app_state.snowflake_generator, 
        &mut seeder.app_state.db.begin().await.unwrap()).await.expect("Failed seeding Organisationn");

    print!("{}", org_id);
}
