use server::models::app::init_app_state;
use server::models::app::AppState;
use server::models::offer::Offer;
use server::models::rating::{Rating, NewRating};
use server::models::user::{User, UserRole};
use server::models::organisation::{Organisation};
use server::models::role::{Role, RoleUpdate};
use server::models::question::*;
use server::models::answer::*;
use server::models::application::{Application, NewApplication, ApplicationRole};
use chrono::{DateTime, Utc};
use server::models::error::ChaosError;

pub struct Seeder {
    pub app_state: AppState
}

impl Seeder {
    pub async fn init() -> Seeder {
        Seeder {
            app_state: init_app_state().await
        }
    }

    pub async fn seed_database(&mut self, admin_email: String) -> Result<(), ChaosError> {
        let mut tx = self.app_state.db.begin().await?;

        // Check if super user already exists, and if not, create them
        let possible_super_user = User::find_by_email(admin_email.clone(), &mut tx).await?;
        if let None = possible_super_user {
            let super_user = User {
                id: 1,
                email: admin_email,
                zid: Some("z8888888".to_string()),
                name: "Chaos Super User".to_string(),
                pronouns: None,
                gender: None,
                degree_name: Some("Bachelor of Chaos Development (Honours)".to_string()),
                degree_starting_year: Some(2021),
                role: UserRole::SuperUser,
            };

            User::create_user(super_user, &mut tx).await?;
        }

        if let Err(_) = Organisation::get_by_slug("devsoc".to_string(), &mut tx).await {
            let org_id = Organisation::create(
                1,
                "devsoc".to_string(),
                "UNSW DevSoc".to_string(),
                "contact@devsoc.app".to_string(),
                Some("https://devsoc.app".to_string()),
                &mut self.app_state.snowflake_generator,
                &mut tx
            ).await?;

            Organisation::update_admins(
                org_id,
                vec![1],
                &mut tx
            ).await?;
        }
    
        Ok(())
    }
}