use crate::database::models::OrganisationUser;
use crate::database::schema::*;
use diesel::{
    expression_methods::ExpressionMethods, query_dsl::QueryDsl, JoinOnDsl, PgConnection,
    RunQueryDsl,
};

/*
Permission Documentation

The implmentation below is designed to be used in this pattern:

    db.run(move |conn| {
        let campaign = Campaign::get_from_id(conn, campaign_id)
            .ok_or_else(|| Json(RolesError::CampaignNotFound))?;

        OrganisationUser::campaign_admin_level(campaign_id, user.id, &conn)
            .is_at_least_director()
            .and(campaign.draft) // is at least director AND campaign is a draft
            .check()
            .or_else(|_| Err(Json(RolesError::Unauthorized)))?;
    }).await

This allows you to search for different admin levels while keeping everything in one place.


Note on repeated code in this file:

I originally wanted to do a dynamic set of inner joins, then execute in a pattern like this:
(this would have been implemented with BoxedExpression)

    db.run(move |conn| {
        let campaign = Campaign::get_from_id(conn, campaign_id)
            .ok_or_else(|| Json(RolesError::CampaignNotFound))?;

        OrganisationUser::campaign_admin_level(campaign_id, user.id)
            .is_at_least_director()
            .and(campaign.draft) // is at least director AND campaign is a draft
            .check(&conn)
            .or_else(|_| Err(Json(RolesError::Unauthorized)))?;
    }).await

However, diesel doesn't yet support boxed queries with inner joins (only single tables)
At the point at which this is supported, this file can be cleaned up massively and the above
syntax can be implemented (oh woe the youth of the rust language)
*/

pub enum PermissionError {
    Unauthorized,
    ConditionNotMet,
}

pub struct AdminLevelUser {
    // (admin_level, is_superuser)
    res: Result<(AdminLevel, bool), PermissionError>,
}

impl AdminLevelUser {
    pub fn is_at_least_director(self) -> AdminLevelUser {
        match self.res {
            Ok((_, true)) | Ok((AdminLevel::Admin, false)) | Ok((AdminLevel::Director, false)) => {
                self
            }
            _ => AdminLevelUser {
                res: Err(PermissionError::Unauthorized),
            },
        }
    }

    pub fn is_admin(self) -> AdminLevelUser {
        match self.res {
            Ok((_, true)) | Ok((AdminLevel::Admin, false)) => self,
            _ => AdminLevelUser {
                res: Err(PermissionError::Unauthorized),
            },
        }
    }

    pub fn is_superuser(self) -> AdminLevelUser {
        match self.res {
            Ok((_, true)) => self,
            _ => AdminLevelUser {
                res: Err(PermissionError::Unauthorized),
            },
        }
    }

    pub fn and(self, condition: bool) -> AdminLevelUser {
        match condition {
            true => self,
            false => AdminLevelUser {
                res: Err(PermissionError::ConditionNotMet),
            },
        }
    }

    pub fn check(self) -> Result<(AdminLevel, bool), PermissionError> {
        self.res
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
