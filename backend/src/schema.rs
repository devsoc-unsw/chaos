// @generated automatically by Diesel CLI.

pub mod sql_types {
    #[derive(diesel::sql_types::SqlType)]
    #[diesel(postgres_type(name = "admin_level"))]
    pub struct AdminLevel;

    #[derive(diesel::sql_types::SqlType)]
    #[diesel(postgres_type(name = "application_status"))]
    pub struct ApplicationStatus;

    #[derive(diesel::sql_types::SqlType)]
    #[diesel(postgres_type(name = "question_type"))]
    pub struct QuestionType;
}

diesel::table! {
    use diesel::sql_types::*;
    use super::sql_types::QuestionType;

    answers (id) {
        id -> Int4,
        application_id -> Int4,
        question_id -> Int4,
        description -> Text,
        created_at -> Timestamp,
        updated_at -> Timestamp,
        answer_type -> QuestionType,
    }
}

diesel::table! {
    use diesel::sql_types::*;
    use super::sql_types::ApplicationStatus;

    applications (id) {
        id -> Int4,
        user_id -> Int4,
        role_id -> Int4,
        status -> ApplicationStatus,
        created_at -> Timestamp,
        updated_at -> Timestamp,
        private_status -> Nullable<ApplicationStatus>,
    }
}

diesel::table! {
    campaigns (id) {
        id -> Int4,
        organisation_id -> Int4,
        name -> Text,
        cover_image -> Nullable<Text>,
        description -> Text,
        starts_at -> Timestamp,
        ends_at -> Timestamp,
        published -> Bool,
        created_at -> Timestamp,
        updated_at -> Timestamp,
    }
}

diesel::table! {
    comments (id) {
        id -> Int4,
        application_id -> Int4,
        commenter_user_id -> Int4,
        description -> Text,
        created_at -> Timestamp,
        updated_at -> Timestamp,
    }
}

diesel::table! {
    multi_select_answers (id) {
        id -> Int4,
        option_id -> Int4,
        answer_id -> Int4,
    }
}

diesel::table! {
    multi_select_options (id) {
        id -> Int4,
        text -> Text,
        question_id -> Int4,
    }
}

diesel::table! {
    use diesel::sql_types::*;
    use super::sql_types::AdminLevel;

    organisation_users (id) {
        id -> Int4,
        user_id -> Int4,
        organisation_id -> Int4,
        admin_level -> AdminLevel,
        created_at -> Timestamp,
        updated_at -> Timestamp,
    }
}

diesel::table! {
    organisations (id) {
        id -> Int4,
        name -> Text,
        logo -> Nullable<Text>,
        created_at -> Timestamp,
        updated_at -> Timestamp,
    }
}

diesel::table! {
    use diesel::sql_types::*;
    use super::sql_types::QuestionType;

    questions (id) {
        id -> Int4,
        title -> Text,
        description -> Nullable<Text>,
        max_bytes -> Int4,
        required -> Bool,
        created_at -> Timestamp,
        updated_at -> Timestamp,
        role_id -> Nullable<Int4>,
        question_type -> QuestionType,
    }
}

diesel::table! {
    ratings (id) {
        id -> Int4,
        application_id -> Int4,
        rater_user_id -> Int4,
        rating -> Int4,
        created_at -> Timestamp,
        updated_at -> Timestamp,
    }
}

diesel::table! {
    roles (id) {
        id -> Int4,
        campaign_id -> Int4,
        name -> Text,
        description -> Nullable<Text>,
        min_available -> Int4,
        max_available -> Int4,
        finalised -> Bool,
        created_at -> Timestamp,
        updated_at -> Timestamp,
    }
}

diesel::table! {
    short_answer_answers (id) {
        id -> Int4,
        text -> Text,
        answer_id -> Int4,
    }
}

diesel::table! {
    users (id) {
        id -> Int4,
        email -> Text,
        zid -> Text,
        display_name -> Text,
        degree_name -> Text,
        degree_starting_year -> Int4,
        superuser -> Bool,
        created_at -> Timestamp,
        updated_at -> Timestamp,
    }
}

diesel::joinable!(answers -> applications (application_id));
diesel::joinable!(answers -> questions (question_id));
diesel::joinable!(applications -> roles (role_id));
diesel::joinable!(applications -> users (user_id));
diesel::joinable!(campaigns -> organisations (organisation_id));
diesel::joinable!(comments -> applications (application_id));
diesel::joinable!(comments -> users (commenter_user_id));
diesel::joinable!(multi_select_answers -> answers (answer_id));
diesel::joinable!(multi_select_answers -> multi_select_options (option_id));
diesel::joinable!(multi_select_options -> questions (question_id));
diesel::joinable!(organisation_users -> organisations (organisation_id));
diesel::joinable!(organisation_users -> users (user_id));
diesel::joinable!(ratings -> applications (application_id));
diesel::joinable!(ratings -> users (rater_user_id));
diesel::joinable!(roles -> campaigns (campaign_id));
diesel::joinable!(short_answer_answers -> answers (answer_id));

diesel::allow_tables_to_appear_in_same_query!(
    answers,
    applications,
    campaigns,
    comments,
    multi_select_answers,
    multi_select_options,
    organisation_users,
    organisations,
    questions,
    ratings,
    roles,
    short_answer_answers,
    users,
);
