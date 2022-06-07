#![allow(unused_variables)]

use backend::database::models::*;
use backend::database::schema::{AdminLevel, ApplicationStatus};
use chrono::naive::NaiveDate;
use diesel::pg::PgConnection;
use diesel::prelude::*;
use std::env;

pub fn establish_connection() -> PgConnection {
    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    PgConnection::establish(&database_url).expect(&format!("Error connecting to {}", database_url))
}

pub fn seed() {
    println!("SEEDING\n");

    let connection = establish_connection();
    let users = vec![
        NewUser {
            email: "shrey.somaiya@gmail.com".to_string(),
            zid: "z5257343".to_string(),
            display_name: "Shrey Somaiya".to_string(),
            degree_name: "B. CompSci".to_string(),
            degree_starting_year: 2019,
            superuser: true,
        },
        NewUser {
            email: "fake.user@gmail.com".to_string(),
            zid: "z1234567".to_string(),
            display_name: "Fake User".to_string(),
            degree_name: "B. CompSci".to_string(),
            degree_starting_year: 2019,
            superuser: false,
        },
        NewUser {
            email: "michael.gribben@gmail.com".to_string(),
            zid: "z5259232".to_string(),
            display_name: "Michael Gribben".to_string(),
            degree_name: "B. Eng (Software)".to_string(),
            degree_starting_year: 2019,
            superuser: false,
        },
        NewUser {
            email: "giuliana.debellis@gmail.com".to_string(),
            zid: "z5259232".to_string(),
            display_name: "Giuliana Debellis".to_string(),
            degree_name: "B. CompSci".to_string(),
            degree_starting_year: 2020,
            superuser: false,
        },
        NewUser {
            email: "lachlan.ting@gmail.com".to_string(),
            zid: "z5264855".to_string(),
            display_name: "Lachlan Ting".to_string(),
            degree_name: "B. CompSci".to_string(),
            degree_starting_year: 2019,
            superuser: false,
        },
        NewUser {
            email: "hayes.choy@gmail.com".to_string(),
            zid: "z528816".to_string(),
            display_name: "Hayes Choi".to_string(),
            degree_name: "B. CompSci".to_string(),
            degree_starting_year: 2020,
            superuser: false,
        },
        NewUser {
            email: "clarence.feng@gmail.com".to_string(),
            zid: "z5260633".to_string(),
            display_name: "Clarence Feng".to_string(),
            degree_name: "B. CompSci".to_string(),
            degree_starting_year: 2020,
            superuser: false,
        },
    ];

    // add all users
    for user in &users {
        user.insert(&connection)
            .expect(&format!("Failed to insert user {}.", user.display_name));
    }
    println!("... Added {} users\n", users.len());

    // create two organisations

    let orgs = vec![
        NewOrganisation {
            name: "CSESoc UNSW".to_string(),
            logo: Some(std::fs::read("./assets/csesoc_logo.png").unwrap()),
        },
        NewOrganisation {
            name: "180 Degrees Consulting".to_string(),
            logo: Some(std::fs::read("./assets/180DC.png").unwrap()),
        },
    ];

    for org in &orgs {
        org.insert(&connection)
            .expect(&format!("Failed to insert org {}.", org.name));
    }

    assert!(Organisation::get_all(&connection).len() == 2);

    println!("... Added {} organizations\n", orgs.len());
    // make giuliana the admin of csesoc

    let giuliana_user = User::get_from_email(&connection, "giuliana.debellis@gmail.com")
        .expect("Failed to get giuliana user from email");

    let csesoc_org =
        Organisation::find_by_name(&connection, "CSESoc UNSW").expect("csesoc should exist");

    let giuliana_csesoc_admin = NewOrganisationUser {
        user_id: giuliana_user.id,
        organisation_id: csesoc_org.id,
        admin_level: AdminLevel::Admin,
    }
    .insert(&connection)
    .expect("Failed to insert giuliana as admin");

    println!("... Adding guiuliana as csesoc admin\n");

    // make clarence a director of csesoc
    let clarence_user = User::get_from_email(&connection, "clarence.feng@gmail.com")
        .expect("Failed to get giuliana user from email");

    let clarence_csesoc_director = NewOrganisationUser {
        user_id: clarence_user.id,
        organisation_id: csesoc_org.id,
        admin_level: AdminLevel::Director,
    }
    .insert(&connection)
    .expect("failed to insert org user clarence");

    println!("... Adding clarence as csesoc director\n");
    // create peer mentoring campaign for csesoc

    let new_campaign = NewCampaign {
        name: "2022 Peer Mentor Recruitment".to_string(),
        description: "Peer mentors are an important part of CSESoc and university life at UNSW. We are looking for enthusiastic students who are passionate about helping first-year students, gaining leadership experience, communication skills, some resume-worthy additions, and having a lot of fun in the upcoming term (Term 1, 2022)! 🎉".to_string(),
        organisation_id: csesoc_org.id,
        starts_at: NaiveDate::from_ymd(2022, 1, 1).and_hms(10, 00, 00),
        ends_at: NaiveDate::from_ymd(2022, 2, 20).and_hms(23, 59, 59),
        cover_image: Some(std::fs::read("./assets/csesoc_peer_mentoring.jpg").unwrap()),
        published: true,
    }.insert(&connection).expect("failed to insert new campaign");

    println!("... Creating peer mentoring campaign\n");

    let mentor_role = RoleUpdate {
        campaign_id: new_campaign.id,
        name: "Peer Mentor".to_string(),
        description: Some("help students 5head".to_string()),
        min_available: 70,
        max_available: 100,
        finalised: false,
    }
    .insert(&connection)
    .expect("Failed to insert Peer Mentor role");

    let senior_mentor_role = RoleUpdate {
        campaign_id: new_campaign.id,
        name: "Senior Mentor".to_string(),
        description: Some("help with organisation".to_string()),
        min_available: 1,
        max_available: 3,
        finalised: false,
    }
    .insert(&connection)
    .expect("Failed to insert senior mentor role");

    println!("... Creating peer mentor and senior mentor role\n");
    // attatch two questions two senior mentor role
    let question_one = NewQuestion {
        title: "What is the meaning of life?".to_string(),
        max_bytes: 100,
        role_ids: vec![senior_mentor_role.id],
        required: false,
        description: Some("Please ensure to go into great detail!".to_string()),
    }
    .insert(&connection)
    .expect("Failed to insert question");

    let question_two = NewQuestion {
        title: "Why do you want to be a Peer Mentor".to_string(),
        max_bytes: 300,
        role_ids: vec![senior_mentor_role.id, mentor_role.id],
        required: true,
        description: Some("Please explain why you would like to be a peer mentor!".to_string()),
    }
    .insert(&connection)
    .expect("Failed to insert question");

    println!("... Creating senior mentor questions\n");
    // hayes choy wants to apply for the senior peer mentor role

    let application = NewApplication {
        role_id: senior_mentor_role.id,
        user_id: User::get_from_email(&connection, "hayes.choy@gmail.com")
            .unwrap()
            .id,
        status: ApplicationStatus::Pending,
    }
    .insert(&connection)
    .expect("Failed to insert application");

    let application = NewApplication {
        role_id: senior_mentor_role.id,
        user_id: User::get_from_email(&connection, "shrey.somaiya@gmail.com")
            .unwrap()
            .id,
        status: ApplicationStatus::Pending,
    }
    .insert(&connection)
    .expect("Failed to insert application");

    println!("... Creating hayes application\n");

    // create answers to question one
    let hayes_qn_one_answer = NewAnswer {
        question_id: question_one.id,
        application_id: application.id,
        description: "42".to_string(),
    }
    .insert(&connection)
    .expect("Failed to insert answer");

    println!("... Creating hayes answer to question one\n");
    // lets create a rating for hayes from Giuliana

    let hayes_rating_from_giuliana = NewRating {
        application_id: application.id,
        rater_user_id: giuliana_csesoc_admin.user_id,
        rating: 0,
    }
    .insert(&connection)
    .expect("Failed to insert rating");

    let hayes_rating_from_clarence = NewRating {
        application_id: application.id,
        rater_user_id: clarence_csesoc_director.user_id,
        rating: 5,
    }
    .insert(&connection)
    .expect("Failed to insert rating");

    let hayes_comment_from_giuliana = NewComment {
        application_id: application.id,
        commenter_user_id: giuliana_csesoc_admin.user_id,
        description: "bad answers".to_string(),
    }
    .insert(&connection)
    .expect("Failed to insert comment");

    let hayes_comment_from_clarence = NewComment {
        application_id: application.id,
        commenter_user_id: clarence_csesoc_director.user_id,
        description: "love this guy <3".to_string(),
    }
    .insert(&connection)
    .expect("Failed to insert comment");

    println!("... Creating hayes comments and ratings\n");
}
