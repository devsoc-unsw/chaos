use std::fmt::Error;
use server::handler::application;
use server::models::app;
use server::models::app::init_app_state;
use server::models::app::AppState;
use server::models::rating::{Rating, NewRating};
use server::models::user::{User, UserRole};
use server::models::organisation::{Organisation};
use server::models::role::{Role, RoleUpdate};
use server::models::question::*;
use server::models::answer::*;
use server::models::application::{Application, NewApplication, ApplicationRole};
use chrono::{DateTime, Utc};


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
    let users = vec![
        User {
            id: 1,
            email: "example.superuser@chaos.devsoc.app".to_string(),
            zid: Some("z5555555".to_string()),
            name: "Francis Urquhart".to_string(),
            pronouns: Some("Ze/Za".to_string()),
            gender: Some("Otter".to_string()),
            degree_name: Some("Bachelor of Arts".to_string()),
            degree_starting_year: Some(1900),
            role: UserRole::SuperUser,
        },
        User {
            id: 2,
            email: "example.admin@chaos.devsoc.app".to_string(),
            zid: Some("z5555556".to_string()),
            name: "Edmund Blackadder".to_string(),
            pronouns: Some("De/Da".to_string()),
            gender: Some("Kuma".to_string()),
            degree_name: Some("Bachelor of Engineering (Honours) (Mining)".to_string()),
            degree_starting_year: Some(1914),
            role: UserRole::User,
        },
        User {
            id: 3,
            email: "example.user@chaos.devsoc.app".to_string(),
            zid: Some("z5555557".to_string()),
            name: "John Bull".to_string(),
            pronouns: None,
            gender: None,
            degree_name: Some("Bachelor of Social Work (Honours)".to_string()),
            degree_starting_year: Some(2024),
            role: UserRole::User,
        }
    ];

    for user in users {
        User::create_user(user, &seeder.app_state.db).await.expect("Failed seeding Root User");
    }

    let mut transaction = seeder.app_state.db.begin().await.unwrap();
    let org_id = Organisation::create(1, 
        "devsoc".to_string(), 
        "UNSW DevSoc".to_string(),
        seeder.app_state.snowflake_generator, 
        &mut transaction).await.expect("Failed seeding Organisationn");
    transaction.commit().await.expect("Failed committing transaction seeding Organisation");

    let mut transaction = seeder.app_state.db.begin().await.unwrap();
    Organisation::update_admins(org_id, 
        vec![2], 
        &mut transaction).await.expect("Failed updating Organisation Admin");
    transaction.commit().await.expect("Failed committing transaction updating Organisation Admin");

    let campaign_id = Organisation::create_campaign(
            org_id,
            "ChaosCampusRecruitment".to_string(),
            "Chaos Campus Recruitment".to_string(),
            Some("This Campaign will MAKE EVERYONE EMPLOYEED".to_string()),
            DateTime::<Utc>::from_naive_utc_and_offset(
                chrono::NaiveDate::from_ymd_opt(2024, 1, 1).unwrap().and_hms_milli_opt(0, 0, 0, 0).unwrap(),
                Utc,
            )
            ,
            DateTime::<Utc>::from_naive_utc_and_offset(
                chrono::NaiveDate::from_ymd_opt(2040, 1, 1).unwrap().and_hms_milli_opt(0, 0, 0, 0).unwrap(),
                Utc,
            ),
            &seeder.app_state.db,
            seeder.app_state.snowflake_generator,
        )
        .await.expect("Failed seeding Campaign");
    

    let mut transaction = seeder.app_state.db.begin().await.unwrap();
    let role_id_1 = Role::create(
        campaign_id,
        RoleUpdate {
            name: "Software Engineer".to_string(),
            description: Some("We are looking for a Software Engineer to join our team.".to_string()),
            min_available: 1,
            max_avaliable: 1,
            finalised: false,
        },
        &mut transaction,
        seeder.app_state.snowflake_generator,
    )
    .await.expect("Failed seeding Role 1");
    transaction.commit().await.expect("Failed committing transaction seeding Roles");

    let mut transaction = seeder.app_state.db.begin().await.unwrap();
    let role_id_2 = Role::create(
        campaign_id,
        RoleUpdate {
            name: "High Temperature Starch Heat Treatment Technician".to_string(),
            description: Some("Just put the fries in the ...".to_string()),
            min_available: 1,
            max_avaliable: 100,
            finalised: true,
        },
        &mut transaction,
        seeder.app_state.snowflake_generator,
    )
    .await.expect("Failed seeding Role 2");
    transaction.commit().await.expect("Failed committing transaction seeding Roles");


    let mut transaction = seeder.app_state.db.begin().await.unwrap();
    let question_id_1 = Question::create(
        campaign_id,
        "Career History".to_string(),
        Some("How many years of industry experience do you have?".to_string()),
        true,
        None,
        true,
        QuestionData::DropDown(
            MultiOptionData {
                options: vec![
                    MultiOptionQuestionOption {
                        id: 0,
                        text: "Less than 1 year".to_string(),
                        display_order: 1,
                    },
                    MultiOptionQuestionOption {
                        id: 0,
                        text: "2 years".to_string(),
                        display_order: 2,
                    },
                    MultiOptionQuestionOption {
                        id: 0,
                        text: "More than 2 years".to_string(),
                        display_order: 3,
                    },
                ]
            },
        ),
        seeder.app_state.snowflake_generator,
        &mut transaction,
    )
    .await.expect("Failed seeding Question 1");

    transaction.commit().await.expect("Failed committing transaction seeding Questions");


    let mut transaction = seeder.app_state.db.begin().await.unwrap();
    let question_id_2 = Question::create(
        campaign_id,
        "Technical Question (pls don't use AI)".to_string(),
        Some("What is a Monad?".to_string()),
        false,
        Some(vec![role_id_1]),
        true,
        QuestionData::ShortAnswer,
        seeder.app_state.snowflake_generator,
        &mut transaction,
    )
    .await.expect("Failed seeding Question 1");
    transaction.commit().await.expect("Failed committing transaction seeding Questions");

    let mut transaction = seeder.app_state.db.begin().await.unwrap();

    let application_id_1 = Application::create(
        campaign_id,
        3,
        NewApplication {
            applied_roles: vec![
                ApplicationRole {
                    id: 0,
                    application_id: 0,
                    campaign_role_id: role_id_1,
                }
            ]
        },
        seeder.app_state.snowflake_generator,
        &mut transaction,
    )
    .await.expect("Failed seeding Application 1");

    let application_id_2 = Application::create(
        campaign_id,
        3,
        NewApplication {
            applied_roles: vec![
                ApplicationRole {
                    id: 0,
                    application_id: 0,
                    campaign_role_id: role_id_2,
                }
            ]
        },
        seeder.app_state.snowflake_generator,
        &mut transaction,
    )
    .await.expect("Failed seeding Application 1");

    transaction.commit().await.expect("Failed committing transaction seeding Applications");


    let mut transaction = seeder.app_state.db.begin().await.unwrap();

    let qtn_1_data = Question::get(question_id_1, &mut transaction).await.expect("Failed getting Question 1");

    let qtn_1_options = 
        match qtn_1_data.question_data {
            QuestionData::DropDown(options) => options.options,
            _ => panic!("Question 1 is not a DropDown question"),
        };    

    transaction.commit().await.expect("Failed committing transaction getting Question 1");

    let mut transaction = seeder.app_state.db.begin().await.unwrap();

    Answer::create(
        application_id_1,
        question_id_1,
        AnswerData::DropDown(qtn_1_options[0].id),
        seeder.app_state.snowflake_generator,
        &mut transaction,
    )
    .await.expect("Failed seeding Answer 1");

    Answer::create(
        application_id_2,
        question_id_1,
        AnswerData::DropDown(qtn_1_options[0].id),
        seeder.app_state.snowflake_generator,
        &mut transaction,
    )
    .await.expect("Failed seeding Answer 2");

    Answer::create(
        application_id_1,
        question_id_2,
        AnswerData::ShortAnswer("A Moand is a Monoid in the Category of Endofunctors, what else do you want?".to_string()),
        seeder.app_state.snowflake_generator,
        &mut transaction,
    )
    .await.expect("Failed seeding Answer 3");

    transaction.commit().await.expect("Failed committing transaction seeding Answers");

    let mut transaction = seeder.app_state.db.begin().await.unwrap();

    Rating::create(
        NewRating { rating: 69, comment: Some("This guy does not know what they are talking about!".to_string()) }, 
        application_id_1, 
        2,
        seeder.app_state.snowflake_generator, 
        &mut transaction)
        .await.expect("Failed seeding Rating 1");

    Rating::create(
        NewRating { rating: 100, comment: None }, 
        application_id_2, 
        2,
        seeder.app_state.snowflake_generator, 
        &mut transaction)
        .await.expect("Failed seeding Rating 2");

    Rating::create(
        NewRating { rating: 100, comment: Some("My cousin's resturant could use a janitor".to_string()) }, 
        application_id_2, 
        1,
        seeder.app_state.snowflake_generator, 
        &mut transaction)
        .await.expect("Failed seeding Rating 2");
    
    transaction.commit().await.expect("Failed committing transaction seeding Ratings");

}
