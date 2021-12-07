use diesel_derive_enum::DbEnum;

#[derive(Debug, DbEnum)]
pub enum ApplicationStatus {
    Pending,
    Rejected,
    Success,
}

#[derive(Debug, DbEnum)]
pub enum AdminLevel {
    ReadOnly,
    Director,
    Admin,
}

diesel::table! {
    use diesel::sql_types::*;

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
    use crate::schema::ApplicationStatusMapping;

    applications (id) {
        id -> Int4,
        user_id -> Int4,
        role_id -> Int4,
        status -> ApplicationStatusMapping,
        created_at -> Timestamp,
        updated_at -> Timestamp,
    }
}

diesel::table! {
    use diesel::sql_types::*;

    campaigns (id) {
        id -> Int4,
        organisation_id -> Int4,
        name -> Text,
        cover_image -> Nullable<Text>,
        description -> Text,
        starts_at -> Timestamp,
        ends_at -> Timestamp,
        created_at -> Timestamp,
        updated_at -> Timestamp,
    }
}

diesel::table! {
    use diesel::sql_types::*;

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
    use crate::schema::AdminLevelMapping;

    organisation_users (id) {
        id -> Int4,
        user_id -> Int4,
        organisation_id -> Int4,
        admin_level -> AdminLevelMapping,
        superuser -> Bool,
        created_at -> Timestamp,
        updated_at -> Timestamp,
    }
}

diesel::table! {
    use diesel::sql_types::*;

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

    questions (id) {
        id -> Int4,
        role_id -> Int4,
        tile -> Text,
        description -> Nullable<Text>,
        max_bytes -> Int4,
        required -> Bool,
        created_at -> Timestamp,
        updated_at -> Timestamp,
    }
}

diesel::table! {
    use diesel::sql_types::*;

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
    use diesel::sql_types::*;

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
    use diesel::sql_types::*;

    users (id) {
        id -> Int4,
        email -> Text,
        google_token -> Text,
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
diesel::joinable!(questions -> roles (role_id));
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
