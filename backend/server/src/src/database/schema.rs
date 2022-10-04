// @generated automatically by Diesel CLI.

pub mod sql_types {
    #[derive(diesel::sql_types::SqlType)]
    #[diesel(postgres_type(name = "admin_level"))]
    pub struct AdminLevel;

    #[derive(diesel::sql_types::SqlType)]
    #[diesel(postgres_type(name = "application_status"))]
    pub struct ApplicationStatus;
}

diesel::table! {
    answers (id) {
        id -> Int4,
        application_id -> Int4,
        question_id -> Int4,
        description -> Text,
        created_at -> Timestamp,
        updated_at -> Timestamp,
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
    }
}

diesel::table! {
    campaigns (id) {
        id -> Int4,
        organisation_id -> Int4,
        name -> Text,
        cover_image -> Nullable<Bytea>,
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
        logo -> Nullable<Bytea>,
        created_at -> Timestamp,
        updated_at -> Timestamp,
    }
}

diesel::table! {
    questions (id) {
        id -> Int4,
        role_ids -> Array<Nullable<Int4>>,
        title -> Text,
        description -> Nullable<Text>,
        max_bytes -> Int4,
        required -> Bool,
        created_at -> Timestamp,
        updated_at -> Timestamp,
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
diesel::joinable!(organisation_users -> organisations (organisation_id));
diesel::joinable!(organisation_users -> users (user_id));
diesel::joinable!(ratings -> applications (application_id));
diesel::joinable!(ratings -> users (rater_user_id));
diesel::joinable!(roles -> campaigns (campaign_id));

diesel::allow_tables_to_appear_in_same_query!(
    answers,
    applications,
    campaigns,
    comments,
    organisation_users,
    organisations,
    questions,
    ratings,
    roles,
    users,
);
