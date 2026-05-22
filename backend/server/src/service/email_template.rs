//! Email template service for the Chaos application.
//!
//! This module provides functionality for managing email templates, including:
//! - Verifying email template admin privileges

use crate::models::error::ChaosError;
use sqlx::{Postgres, Transaction};
use std::ops::DerefMut;

/// Verifies if a user has admin privileges for an email template.
///
/// This function checks if the user is an admin of the organisation that owns the template.
///
/// # Arguments
///
/// * `user_id` - The ID of the user to check
/// * `template_id` - The ID of the email template
/// * `pool` - Database connection pool
///
/// # Returns
///
/// * `Result<(), ChaosError>` - Ok if the user is an admin, Unauthorized error otherwise
pub async fn user_is_email_template_admin(
    user_id: i64,
    template_id: i64,
    transaction: &mut Transaction<'_, Postgres>,
) -> Result<(), ChaosError> {
    let is_admin = sqlx::query!(
        "
            SELECT EXISTS(
                SELECT 1 FROM email_templates et
                JOIN organisation_members m on et.organisation_id = m.organisation_id
                WHERE et.id = $1 AND m.user_id = $2 AND m.role = 'Admin'
            )
        ",
        template_id,
        user_id
    )
    .fetch_one(transaction.deref_mut())
    .await?
    .exists
    .expect("`exists` should always exist in this query result");

    if !is_admin {
        return Err(ChaosError::Unauthorized);
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    // =========================================================================
    // TEST PLAN – Equivalence Partitioning (EP) & Boundary Value Analysis (BVA)
    // =========================================================================
    //
    // Functions under test
    //   · user_is_email_template_admin(user_id, template_id, tx) -> Result<(), ChaosError>
    //
    // ── EQUIVALENCE PARTITIONING ──────────────────────────────────────────────
    //
    // user_is_email_template_admin – inputs
    //
    //  ID    Condition                                         Expected              Test
    //  EP01  user is Admin of the org that owns the template  Ok(())                returns_ok_for_admin_member
    //  EP02  user is User (non-Admin) in the owning org       Err(Unauthorized)     returns_unauthorized_for_non_admin_member
    //  EP03  user is not a member of the owning org at all    Err(Unauthorized)     returns_unauthorized_for_non_member
    //  EP04  user is Admin but of a different org             Err(Unauthorized)     returns_unauthorized_for_admin_of_wrong_org
    //  EP05  template_id does not exist                       Err(Unauthorized)     returns_unauthorized_for_nonexistent_template
    //  EP06  user_id does not exist                           Err(Unauthorized)     returns_unauthorized_for_nonexistent_user
    //
    // ── BOUNDARY VALUE ANALYSIS ───────────────────────────────────────────────
    //
    // organisation_role enum (two values: 'Admin', 'User')
    // The boundary is the role check: only 'Admin' passes; everything else fails.
    //
    //  ID    Value    Expected          Test                                   Status
    //  BV01  Admin    Ok(())            returns_ok_for_admin_member            OK
    //  BV02  User     Err(Unauthorized) returns_unauthorized_for_non_admin_member OK
    //
    // ── KNOWN GAPS ────────────────────────────────────────────────────────────
    //
    //  · The function returns Err(Unauthorized) for both "template does not exist"
    //    and "user has no admin access", making the two failure modes
    //    indistinguishable from the caller's perspective. This is an intentional
    //    design choice to avoid leaking information about whether a template ID
    //    exists, but it means a misconfigured template_id would silently look like
    //    an auth failure.
    // =========================================================================

    use super::*;
    use sqlx::PgPool;

    // ── helpers ──────────────────────────────────────────────────────────────

    async fn seed(pool: &PgPool) {
        // user 1 – Admin of org 10 (the owning org)
        // user 2 – User (non-Admin) of org 10
        // user 3 – not a member of any org
        // user 4 – Admin of org 20 (a different org, does not own the template)
        for (id, email, name) in [
            (1_i64, "admin@test.com", "Admin"),
            (2_i64, "member@test.com", "Member"),
            (3_i64, "outsider@test.com", "Outsider"),
            (4_i64, "other-admin@test.com", "Other Admin"),
        ] {
            sqlx::query("INSERT INTO users (id, email, name) VALUES ($1, $2, $3)")
                .bind(id)
                .bind(email)
                .bind(name)
                .execute(pool)
                .await
                .unwrap();
        }

        for (id, slug, name) in [(10_i64, "org-a", "Org A"), (20_i64, "org-b", "Org B")] {
            sqlx::query("INSERT INTO organisations (id, slug, name) VALUES ($1, $2, $3)")
                .bind(id)
                .bind(slug)
                .bind(name)
                .execute(pool)
                .await
                .unwrap();
        }

        for (org_id, user_id, role) in [
            (10_i64, 1_i64, "Admin"),
            (10_i64, 2_i64, "User"),
            (20_i64, 4_i64, "Admin"),
        ] {
            sqlx::query(
                "INSERT INTO organisation_members (organisation_id, user_id, role)
                 VALUES ($1, $2, $3::organisation_role)",
            )
            .bind(org_id)
            .bind(user_id)
            .bind(role)
            .execute(pool)
            .await
            .unwrap();
        }

        // template 100 is owned by org 10
        sqlx::query(
            "INSERT INTO email_templates (id, organisation_id, name, template_subject, template_body)
             VALUES ($1, $2, $3, $4, $5)",
        )
        .bind(100_i64)
        .bind(10_i64)
        .bind("Welcome")
        .bind("Subject")
        .bind("Body")
        .execute(pool)
        .await
        .unwrap();
    }

    // ── user_is_email_template_admin ──────────────────────────────────────────

    /// an Admin member of the owning org passes the JOIN and role check.
    #[sqlx::test(migrations = "../migrations")]
    async fn returns_ok_for_admin_member(pool: PgPool) {
        seed(&pool).await;
        let mut tx = pool.begin().await.unwrap();
        let result = user_is_email_template_admin(1, 100, &mut tx).await;
        assert!(matches!(result, Ok(())));
    }

    /// a User (non-Admin) member fails the role = 'Admin' check.
    #[sqlx::test(migrations = "../migrations")]
    async fn returns_unauthorized_for_non_admin_member(pool: PgPool) {
        seed(&pool).await;
        let mut tx = pool.begin().await.unwrap();
        let result = user_is_email_template_admin(2, 100, &mut tx).await;
        assert!(matches!(result, Err(ChaosError::Unauthorized)));
    }

    /// a user with no membership row for the owning org finds no JOIN match.
    #[sqlx::test(migrations = "../migrations")]
    async fn returns_unauthorized_for_non_member(pool: PgPool) {
        seed(&pool).await;
        let mut tx = pool.begin().await.unwrap();
        let result = user_is_email_template_admin(3, 100, &mut tx).await;
        assert!(matches!(result, Err(ChaosError::Unauthorized)));
    }

    /// an Admin of a different org does not match the template's org in the JOIN.
    #[sqlx::test(migrations = "../migrations")]
    async fn returns_unauthorized_for_admin_of_wrong_org(pool: PgPool) {
        seed(&pool).await;
        let mut tx = pool.begin().await.unwrap();
        let result = user_is_email_template_admin(4, 100, &mut tx).await;
        assert!(matches!(result, Err(ChaosError::Unauthorized)));
    }

    /// a non-existent template_id produces no rows in the EXISTS subquery.
    #[sqlx::test(migrations = "../migrations")]
    async fn returns_unauthorized_for_nonexistent_template(pool: PgPool) {
        seed(&pool).await;
        let mut tx = pool.begin().await.unwrap();
        let result = user_is_email_template_admin(1, 999, &mut tx).await;
        assert!(matches!(result, Err(ChaosError::Unauthorized)));
    }

    /// a non-existent user_id finds no membership row, so EXISTS returns false.
    #[sqlx::test(migrations = "../migrations")]
    async fn returns_unauthorized_for_nonexistent_user(pool: PgPool) {
        seed(&pool).await;
        let mut tx = pool.begin().await.unwrap();
        let result = user_is_email_template_admin(999, 100, &mut tx).await;
        assert!(matches!(result, Err(ChaosError::Unauthorized)));
    }
}
