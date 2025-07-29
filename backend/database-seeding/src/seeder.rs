use std::fmt::Error;
use server::handler::application;
use server::models::app;
use server::models::app::init_app_state;
use server::models::app::AppState;
use server::models::offer::Offer;
use server::models::rating::{Rating, NewRating};
use server::models::user::{User, UserRole};
use server::models::organisation::{Organisation};
use server::models::role::{Role, RoleUpdate};
use server::models::question::*;
use server::models::answer::*;
use server::models::offer::*;
use server::models::email_template::*;
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

pub async fn seed_database(mut seeder: Seeder) {
    let mut tx = seeder.app_state.db.begin().await.expect("Error beginning DB transaction");

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
        User::create_user(user, &mut tx).await.expect("Failed seeding Root User");
    }

    let org_id = Organisation::create(1, 
        "devsoc".to_string(), 
        "UNSW DevSoc".to_string(),
        &mut seeder.app_state.snowflake_generator, 
        &mut tx).await.expect("Failed seeding Organisation");

    Organisation::update_admins(org_id, 
        vec![2], 
        &mut tx).await.expect("Failed updating Organisation Admin");

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
            &mut tx,
            &mut seeder.app_state.snowflake_generator,
        )
        .await.expect("Failed seeding Campaign");
    

    let role_id_1 = Role::create(
        campaign_id,
        RoleUpdate {
            name: "Software Engineer".to_string(),
            description: Some("We are looking for a Software Engineer to join our team.".to_string()),
            min_available: 1,
            max_avaliable: 1,
            finalised: false,
        },
        &mut tx,
        &mut seeder.app_state.snowflake_generator,
    )
    .await.expect("Failed seeding Role 1");

    let role_id_2 = Role::create(
        campaign_id,
        RoleUpdate {
            name: "High Temperature Starch Heat Treatment Technician".to_string(),
            description: Some("Just put the fries in the ...".to_string()),
            min_available: 1,
            max_avaliable: 100,
            finalised: true,
        },
        &mut tx,
        &mut seeder.app_state.snowflake_generator,
    )
    .await.expect("Failed seeding Role 2");

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
        &mut seeder.app_state.snowflake_generator,
        &mut tx,
    )
    .await.expect("Failed seeding Question 1");


    let question_id_2 = Question::create(
        campaign_id,
        "Technical Question (pls don't use AI)".to_string(),
        Some("What is a Monad?".to_string()),
        false,
        Some(vec![role_id_1]),
        true,
        QuestionData::ShortAnswer,
        &mut seeder.app_state.snowflake_generator,
        &mut tx,
    )
    .await.expect("Failed seeding Question 1");

    let application_id_1 = Application::create(
        campaign_id,
        3,
        NewApplication {
            applied_roles: vec![
                ApplicationRole {
                    id: 0,
                    application_id: 0,
                    campaign_role_id: role_id_1,
                    preference: 1,
                }
            ]
        },
        &mut seeder.app_state.snowflake_generator,
        &mut tx,
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
                    preference: 1,
                }
            ]
        },
        &mut seeder.app_state.snowflake_generator,
        &mut tx,
    )
    .await.expect("Failed seeding Application 1");

    let qtn_1_data = Question::get(question_id_1, &mut tx).await.expect("Failed getting Question 1");

    let qtn_1_options = 
        match qtn_1_data.question_data {
            QuestionData::DropDown(options) => options.options,
            _ => panic!("Question 1 is not a DropDown question"),
        };

    Answer::create(
        application_id_1,
        question_id_1,
        AnswerData::DropDown(qtn_1_options[0].id),
        &mut seeder.app_state.snowflake_generator,
        &mut tx,
    )
    .await.expect("Failed seeding Answer 1");

    Answer::create(
        application_id_2,
        question_id_1,
        AnswerData::DropDown(qtn_1_options[0].id),
        &mut seeder.app_state.snowflake_generator,
        &mut tx,
    )
    .await.expect("Failed seeding Answer 2");

    Answer::create(
        application_id_1,
        question_id_2,
        AnswerData::ShortAnswer("A Moand is a Monoid in the Category of Endofunctors, what else do you want?".to_string()),
        &mut seeder.app_state.snowflake_generator,
        &mut tx,
    )
    .await.expect("Failed seeding Answer 3");

    Rating::create(
        NewRating { rating: 69, comment: Some("This guy does not know what they are talking about!".to_string()) }, 
        application_id_1, 
        2,
        &mut seeder.app_state.snowflake_generator, 
        &mut tx)
        .await.expect("Failed seeding Rating 1");

    Rating::create(
        NewRating { rating: 100, comment: None }, 
        application_id_2, 
        2,
        &mut seeder.app_state.snowflake_generator, 
        &mut tx)
        .await.expect("Failed seeding Rating 2");

    Rating::create(
        NewRating { rating: 100, comment: Some("My cousin's restaurant could use a janitor".to_string()) },
        application_id_2, 
        1,
        &mut seeder.app_state.snowflake_generator,
        &mut tx)
        .await.expect("Failed seeding Rating 3");
    
    let template = 
    "Hello {{name}},

    Congratulations! You have been selected for the role of {{role}} at {{organisation_name}} for our {{campaign_name}}.

    Please confirm your acceptance by {{expiry_date}}.

    Best regards,  
    The {{organisation_name}} Team".to_string();


    let email_template_id = Organisation::create_email_template(
        org_id, 
        "Offer".to_string(),
        "[DevSoc] Position Offer".to_string(),
        template, 
        &mut tx, 
        &mut seeder.app_state.snowflake_generator)
        .await.expect("Failed seeding Email Template");

    Offer::create(
        campaign_id, 
        application_id_1, 
        email_template_id, 
        role_id_1, 
        DateTime::<Utc>::from_naive_utc_and_offset(
                chrono::NaiveDate::from_ymd_opt(2024, 2, 1).unwrap().and_hms_milli_opt(0, 0, 0, 0).unwrap(),
                Utc,
            ), 
        &mut tx,
        &mut seeder.app_state.snowflake_generator)
        .await.expect("Failed seeding Offer");

    tx.commit().await.expect("Failed to commit DB transaction");
}
