use std::ops::DerefMut;
use std::env;
use server::models::app::init_app_state;
use server::models::app::AppState;
use server::models::user::{User, UserRole};
use server::models::organisation::{Organisation};
use sqlx;

pub struct Seeder {
    pub app_state: AppState
}

pub async fn init() -> Seeder {
        let seeder = Seeder {
            app_state: init_app_state().await
        };

        seeder
    }

pub async fn seed_database(mut seeder: Seeder) {
    let mut tx = seeder.app_state.db.begin().await.expect("Error beginning DB transaction");
    let super_user_email = env::var("SUPER_USER_EMAIL").expect("SUPER_USER_EMAIL must be set");

    // CREATE SUPERUSER
    let super_user = User {
        id: 10000 as i64,
        email: super_user_email.clone(),
        zid: None,
        name: "Super Admin".to_string(),
        pronouns: None,
        gender: None,
        degree_name: None,
        degree_starting_year: None,
        role: UserRole::SuperUser,
    };
    let super_user_exists = sqlx::query!(
        "SELECT id FROM users WHERE lower(email) = $1",
        super_user_email.to_lowercase()
    )
    .fetch_optional(tx.deref_mut())
    .await
    .expect("Error fetching director email!");

    if super_user_exists.is_none() {
        User::create_user(super_user, &mut tx) .await .expect("Error seeding superuser account!");
    }

    // CREATE ORG defaulting here because we only care about devsoc when seeding
    let org_slug = env::var("SEED_ORG_SLUG")
        .unwrap_or_else(|_| "devsoc".to_string());

    let org_exists = sqlx::query!(
        "SELECT id FROM organisations WHERE slug = $1",
        org_slug.to_lowercase()
    )
    .fetch_optional(tx.deref_mut())
    .await
    .expect("Failed to check if organisation exists");

    if org_exists.is_none() {
        Organisation::create(10000,
            org_slug,
            "UNSW DevSoc".to_string(),
            "contact@devsoc.app".to_string(),
            Some("https://devsoc.app".to_string()),
            &mut seeder.app_state.snowflake_generator,
            &mut tx).await.expect("Failed seeding Organisation");
    }
    tx.commit().await.expect("Failed to commit transaction");
}
