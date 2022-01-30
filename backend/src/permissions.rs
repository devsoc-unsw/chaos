use crate::database::models::{OrganisationUser, SuperUser};
use crate::database::schema::*;
use diesel::{
    expression_methods::ExpressionMethods, query_dsl::QueryDsl, BoolExpressionMethods, JoinOnDsl,
    PgConnection, RunQueryDsl,
};
use dotenv::Error;
/*
Permission Documentation

The implmentation below is designed to be used in this pattern:

    // check auth
    db.run(move |conn|
        OrganisationUser::campaign_admin_level(role.campaign_id, user.id, &conn)
        .at_least_director()
        .or_else(|_| Err(Json(RoleError::Unauthorized)))
    ).await?;

This allows you to search for different admin levels while keeping everything in one place.


Note on repeated code in this file:

I originally wanted to do a dynamic set of inner joins, then execute in a pattern like this:
(this would have been implemented with BoxedExpression)

    db.run(move |conn|
        OrganisationUser::campaign_admin_level(role.campaign_id, user.id)
        .check(&conn)
        .at_least_director()
        .or_else(|_| Err(Json(RoleError::Unauthorized)))
    ).await?;

However, diesel doesn't yet support boxed queries with inner joins (only single tables)
At the point at which this is supported, this file can be cleaned up massively and the above
syntax can be implemented (oh woe the youth of the rust language)
*/

pub enum PermissionError {
    Unauthorized,
}

pub struct AdminLevelUser {
    // (admin_level, is_superuser)
    res: Result<(AdminLevel, bool), PermissionError>,
}

impl AdminLevelUser {
    pub fn is_at_least_director(self) -> Result<(AdminLevel, bool), PermissionError> {
        match self.res {
            Ok((_, true)) | Ok((AdminLevel::Admin, false)) | Ok((AdminLevel::Director, false)) => {
                self.res
            }
            _ => Err(PermissionError::Unauthorized),
        }
    }

    pub fn is_admin(self) -> Result<(AdminLevel, bool), PermissionError> {
        match self.res {
            Ok((_, true)) | Ok((AdminLevel::Admin, false)) => self.res,
            _ => Err(PermissionError::Unauthorized),
        }
    }

    pub fn is_superuser(self) -> Result<(AdminLevel, bool), PermissionError> {
        match self.res {
            Ok((_, true)) => self.res,
            _ => Err(PermissionError::Unauthorized),
        }
    }
}

impl std::convert::From<Result<(AdminLevel, bool), PermissionError>> for AdminLevelUser {
    fn from(res: Result<(AdminLevel, bool), PermissionError>) -> Self {
        AdminLevelUser { res }
    }
}

impl OrganisationUser {
    pub fn organisation_admin_level(
        org_id: i32,
        user_id: i32,
        conn: &PgConnection,
    ) -> AdminLevelUser {
        organisation_users::table
            .filter(organisation_users::organisation_id.eq(org_id))
            .inner_join(users::table.on(users::id.eq(organisation_users::user_id)))
            .filter(users::id.eq(user_id))
            .select((organisation_users::admin_level, users::superuser))
            .first(conn)
            .or_else(|_| Err(PermissionError::Unauthorized))
            .into()
    }

    pub fn campaign_admin_level(
        campaign_id: i32,
        user_id: i32,
        conn: &PgConnection,
    ) -> AdminLevelUser {
        campaigns::table
            .filter(campaigns::id.eq(campaign_id))
            .inner_join(organisations::table.on(organisations::id.eq(campaigns::organisation_id)))
            .inner_join(
                organisation_users::table
                    .on(organisation_users::organisation_id.eq(organisations::id)),
            )
            .inner_join(users::table.on(users::id.eq(organisation_users::user_id)))
            .filter(users::id.eq(user_id))
            .select(organisation_users::admin_level)
            .select((organisation_users::admin_level, users::superuser))
            .first(conn)
            .or_else(|_| Err(PermissionError::Unauthorized))
            .into()
    }

    pub fn application_admin_level(
        application_id: i32,
        user_id: i32,
        conn: &PgConnection,
    ) -> AdminLevelUser {
        applications::table
            .filter(applications::id.eq(application_id))
            .inner_join(roles::table.on(roles::id.eq(applications::role_id)))
            .inner_join(campaigns::table.on(campaigns::id.eq(roles::campaign_id)))
            .inner_join(organisations::table.on(organisations::id.eq(campaigns::organisation_id)))
            .inner_join(
                organisation_users::table
                    .on(organisation_users::organisation_id.eq(organisations::id)),
            )
            .inner_join(users::table.on(users::id.eq(organisation_users::user_id)))
            .filter(users::id.eq(user_id))
            .select((organisation_users::admin_level, users::superuser))
            .first(conn)
            .or_else(|_| Err(PermissionError::Unauthorized))
            .into()
    }

    pub fn comment_admin_level(
        comment_id: i32,
        user_id: i32,
        conn: &PgConnection,
    ) -> AdminLevelUser {
        comments::table
            .filter(comments::id.eq(comment_id))
            .inner_join(applications::table.on(applications::id.eq(comments::application_id)))
            .inner_join(roles::table.on(roles::id.eq(applications::role_id)))
            .inner_join(campaigns::table.on(campaigns::id.eq(roles::campaign_id)))
            .inner_join(organisations::table.on(organisations::id.eq(campaigns::organisation_id)))
            .inner_join(
                organisation_users::table
                    .on(organisation_users::organisation_id.eq(organisations::id)),
            )
            .inner_join(users::table.on(users::id.eq(organisation_users::user_id)))
            .filter(users::id.eq(user_id))
            .select((organisation_users::admin_level, users::superuser))
            .first(conn)
            .or_else(|_| Err(PermissionError::Unauthorized))
            .into()
    }
}
