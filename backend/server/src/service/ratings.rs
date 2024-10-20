use crate::models::campaign::Campaign;
use crate::models::error::ChaosError;
use crate::models::organisation::{Member, MemberList, OrganisationDetails, OrganisationRole};
use chrono::{DateTime, Utc};
use snowflake::SnowflakeIdGenerator;
use sqlx::{Pool, Postgres, Transaction};
use std::ops::DerefMut;
use uuid::Uuid;

/// Any member of the organisation that owns the campaign is an application
/// viewer, because all members are either directors or execs (TODO: might be
/// changed in the future).
pub async fn assert_user_is_application_reviewer_admin_given_application_id(
    user_id: i64,
    application_id: i64,
    pool: &Pool<Postgres>,
) -> Result<(), ChaosError> {
    let is_admin = sqlx::query!(
        r#"
        SELECT EXISTS (
            SELECT 1
            FROM organisation_members om
            JOIN campaigns c ON om.organisation_id = c.organisation_id
            JOIN applications a ON a.campaign_id = c.id
            JOIN application_ratings ar ON a.campaign_id = c.id
            -- Find the organisation that this application rating belongs to
            -- (via the campaign the rating belongs to).
            WHERE a.id = $1
            -- Assert user is member of the organisation that owns the campaign
            -- this application belongs to.
            AND om.user_id = $2
        )
        "#,
        application_id,
        user_id
    )
    .fetch_one(pool)
    .await?
    .exists
    .expect("`exists` should always exist in this query result");

    if !is_admin {
        return Err(ChaosError::Unauthorized);
    }

    Ok(())
}

/// Any member of the organisation that owns the campaign is an application
/// viewer, because all members are either directors or execs (TODO: might be
/// changed in the future).
pub async fn assert_user_is_application_reviewer_admin_given_rating_id(
    user_id: i64,
    rating_id: i64,
    pool: &Pool<Postgres>,
) -> Result<(), ChaosError> {
    let is_admin = sqlx::query!(
        r#"
        SELECT EXISTS (
            SELECT 1
            FROM organisation_members om
            JOIN campaigns c ON om.organisation_id = c.organisation_id
            JOIN applications a ON a.campaign_id = c.id
            JOIN application_ratings ar ON ar.application_id = a.id
            -- Find the organisation that this application rating belongs to
            -- (via the campaign the rating belongs to).
            WHERE ar.id = $1
            -- Assert user is member of the organisation that owns the campaign
            -- this application belongs to.
            AND om.user_id = $2
        )
        "#,
        rating_id,
        user_id
    )
    .fetch_one(pool)
    .await?
    .exists
    .expect("`exists` should always exist in this query result");

    if !is_admin {
        return Err(ChaosError::Unauthorized);
    }

    Ok(())
}

/// Assert the given user is the creator of the rating with the given id and
/// also a current member of the organisation the rating/application is
/// associated with.
pub async fn assert_user_is_rating_creator_and_organisation_member(
    user_id: i64,
    rating_id: i64,
    pool: &Pool<Postgres>,
) -> Result<(), ChaosError> {
    let is_admin = sqlx::query!(
        r#"
        SELECT EXISTS (
            SELECT 1
            FROM organisation_members om
            JOIN campaigns c ON om.organisation_id = c.organisation_id
            JOIN applications a ON a.campaign_id = c.id
            JOIN application_ratings ar ON ar.application_id = a.id
            -- Find the organisation that this application rating belongs to
            -- (via the campaign the rating belongs to).
            WHERE ar.id = $1
            -- Assert user is the rater of the application rating.
            AND ar.rater_id = $2
            -- Assert user is current member of the organisation that owns the
            -- campaign this application belongs to.
            AND om.user_id = $2
        )
        "#,
        rating_id,
        user_id
    )
    .fetch_one(pool)
    .await?
    .exists
    .expect("`exists` should always exist in this query result");

    if !is_admin {
        return Err(ChaosError::Unauthorized);
    }

    Ok(())
}
