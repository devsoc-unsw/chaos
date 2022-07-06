use super::schema::AdminLevel;
use super::schema::ApplicationStatus;
use super::schema::{
    answers, applications, campaigns, comments, organisation_users, organisations, questions,
    ratings, roles, users,
};
use chrono::NaiveDateTime;
use chrono::Utc;
use diesel::prelude::*;
use diesel::PgConnection;
use rocket::FromForm;
use serde::{Deserialize, Serialize};
use std::collections::HashSet;

#[derive(Queryable)]
pub struct User {
    pub id: i32,
    pub email: String,
    pub zid: String,
    pub display_name: String,
    pub degree_name: String,
    pub degree_starting_year: i32,
    pub superuser: bool,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

pub struct SuperUser {
    user: User,
}

impl SuperUser {
    pub fn new(user: User) -> Self {
        Self { user }
    }

    pub fn user(&self) -> &User {
        &self.user
    }
}
#[derive(Insertable)]
#[table_name = "users"]
pub struct NewUser {
    pub email: String,
    pub zid: String,
    pub display_name: String,
    pub degree_name: String,
    pub degree_starting_year: i32,
    pub superuser: bool,
}

impl User {
    pub fn get_all(conn: &PgConnection) -> Vec<User> {
        use crate::database::schema::users::dsl::*;

        users.order(id.asc()).load(conn).unwrap_or_else(|_| vec![])
    }

    pub fn get_number(conn: &PgConnection) -> i64 {
        use crate::database::schema::users::dsl::*;
        use diesel::dsl::count;

        users
            .select(count(display_name))
            .first(conn)
            .unwrap_or_else(|_| 0)
    }

    pub fn get_from_id(conn: &PgConnection, id_val: i32) -> Option<User> {
        use crate::database::schema::users::dsl::*;

        users.filter(id.eq(id_val)).first(conn).ok()
    }

    pub fn get_from_email(conn: &PgConnection, user_email: &str) -> Option<User> {
        use crate::database::schema::users::dsl::*;

        users.filter(email.eq(user_email)).first(conn).ok()
    }

    pub fn get_all_campaigns(&self, conn: &PgConnection) -> Vec<Campaign> {
        use crate::database::schema::campaigns::dsl::*;

        campaigns
            .filter(organisation_id.eq(self.id))
            .order(id.asc())
            .load(conn)
            .unwrap_or_else(|_| vec![])
    }

    pub fn get_all_org_ids_belonging(&self, conn: &PgConnection) -> Vec<i32> {
        if self.superuser {
            return organisations::table
                .select(organisations::id)
                .load::<i32>(conn)
                .unwrap_or_else(|_| vec![]);
        }

        organisation_users::table
            .filter(organisation_users::user_id.eq(self.id))
            .select(organisation_users::organisation_id)
            .load::<i32>(conn)
            .unwrap_or_else(|_| vec![])
    }

    pub fn get_all_orgs_belonging(&self, conn: &PgConnection) -> Vec<Organisation> {
        if self.superuser {
            return organisations::table
                .load::<Organisation>(conn)
                .unwrap_or_else(|_| vec![]);
        }

        organisation_users::table
            .filter(organisation_users::user_id.eq(self.id))
            .inner_join(
                organisations::table.on(organisations::id.eq(organisation_users::organisation_id)),
            )
            .select((
                organisations::id,
                organisations::name,
                organisations::logo,
                organisations::created_at,
                organisations::updated_at,
            ))
            .load::<Organisation>(conn)
            .unwrap_or_else(|_| vec![])
    }
}

impl NewUser {
    pub fn insert(&self, conn: &PgConnection) -> Option<User> {
        use crate::database::schema::users::dsl::*;

        self.insert_into(users).get_result(conn).ok()
    }
}

#[derive(Queryable, Serialize, Deserialize)]
pub struct Organisation {
    pub id: i32,
    pub name: String,
    pub logo: Option<Vec<u8>>,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

#[derive(Insertable, FromForm, Deserialize)]
#[table_name = "organisations"]
pub struct NewOrganisation {
    pub name: String,
    pub logo: Option<Vec<u8>>,
}

impl Organisation {
    pub fn get_all(conn: &PgConnection) -> Vec<Organisation> {
        use crate::database::schema::organisations::dsl::*;

        organisations
            .order(id.asc())
            .load(conn)
            .unwrap_or_else(|_| vec![])
    }

    pub fn get_from_id(conn: &PgConnection, organisation_id: i32) -> Option<Organisation> {
        use crate::database::schema::organisations::dsl::*;

        organisations
            .filter(id.eq(organisation_id))
            .first(conn)
            .ok()
    }

    pub fn delete(conn: &PgConnection, organisation_id: i32) -> Option<usize> {
        use crate::database::schema::organisations::dsl::*;

        let num = diesel::delete(organisations.filter(id.eq(organisation_id)))
            .execute(conn)
            .ok()?;

        if num > 0 {
            Some(num)
        } else {
            None
        }
    }

    pub fn delete_deep(conn: &PgConnection, org_id: i32) -> Option<()> {
        use crate::database::schema::organisation_users::dsl::*;
        let campaigns = Campaign::get_all_from_org_id(conn, org_id);

        for campaign in campaigns {
            Campaign::delete_deep(conn, campaign.id)?;
        }

        diesel::delete(organisation_users.filter(organisation_id.eq(org_id)))
            .execute(conn)
            .ok();

        let num = Organisation::delete(conn, org_id)?;

        if num < 1 {
            return None;
        }

        Some(())
    }

    pub fn find_by_name(conn: &PgConnection, organisation_name: &str) -> Option<Organisation> {
        use crate::database::schema::organisations::dsl::*;

        organisations
            .filter(name.eq(organisation_name))
            .first(conn)
            .ok()
    }

    pub fn get_admin_ids(conn: &PgConnection, org_id: i32) -> Option<Vec<i32>> {
        organisation_users::table
            .filter(organisation_users::organisation_id.eq(org_id))
            .load::<OrganisationUser>(conn)
            .map(|org_users| {
                org_users
                    .into_iter()
                    .filter(|org_user| org_user.admin_level == AdminLevel::Admin)
                    .map(|org_user| org_user.user_id)
                    .collect()
            })
            .ok()
    }

    // FIXME - rather than looping through all admins, filter the users if theyre in admin_ids
    // FIXME - this only works if they're already in the organisation, need to insert them into the
    // organistaion first?
    pub fn set_admins(conn: &PgConnection, org_id: i32, admin_ids: &[i32]) -> Option<usize> {
        use crate::database::schema::organisation_users::dsl::*;

        diesel::update(
            organisation_users
                .filter(organisation_id.eq(org_id))
                .filter(user_id.eq_any(admin_ids)),
        )
        .set(admin_level.eq(AdminLevel::Admin))
        .execute(conn)
        .ok()
    }
}

impl NewOrganisation {
    pub fn insert(&self, conn: &PgConnection) -> Option<Organisation> {
        use crate::database::schema::organisations::dsl::*;

        self.insert_into(organisations).get_result(conn).ok()
    }
}

#[derive(Queryable, Associations)]
#[belongs_to(Organisation)]
#[belongs_to(User)]
pub struct OrganisationUser {
    pub id: i32,
    pub user_id: i32,
    pub organisation_id: i32,
    pub admin_level: AdminLevel,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

#[derive(Insertable)]
#[table_name = "organisation_users"]
pub struct NewOrganisationUser {
    pub user_id: i32,
    pub organisation_id: i32,
    pub admin_level: AdminLevel,
}

impl OrganisationUser {
    pub fn get(
        conn: &PgConnection,
        organisation_id_val: i32,
        user_id_val: i32,
    ) -> Option<OrganisationUser> {
        use crate::database::schema::organisation_users::dsl::*;

        organisation_users
            .filter(organisation_id.eq(organisation_id_val))
            .filter(user_id.eq(user_id_val))
            .first(conn)
            .ok()
    }

    pub fn get_all(conn: &PgConnection) -> Vec<OrganisationUser> {
        use crate::database::schema::organisation_users::dsl::*;

        organisation_users
            .order(id.asc())
            .load(conn)
            .unwrap_or_else(|_| vec![])
    }

    pub fn get_all_from_user_id(conn: &PgConnection, user_id_val: i32) -> Vec<OrganisationUser> {
        use crate::database::schema::organisation_users::dsl::*;

        organisation_users
            .filter(user_id.eq(user_id_val))
            .order(id.asc())
            .load(conn)
            .unwrap_or_else(|_| vec![])
    }

    pub fn get_all_from_organisation_id(
        conn: &PgConnection,
        organisation_id_val: i32,
    ) -> Vec<OrganisationUser> {
        use crate::database::schema::organisation_users::dsl::*;

        organisation_users
            .filter(organisation_id.eq(organisation_id_val))
            .order(id.asc())
            .load(conn)
            .unwrap_or_else(|_| vec![])
    }
}

impl NewOrganisationUser {
    pub fn insert(&self, conn: &PgConnection) -> Option<OrganisationUser> {
        use crate::database::schema::organisation_users::dsl::*;

        self.insert_into(organisation_users).get_result(conn).ok()
    }
}

#[derive(Queryable, Serialize, Debug, Associations)]
#[belongs_to(Organisation)]
pub struct Campaign {
    pub id: i32,
    pub organisation_id: i32,
    pub name: String,
    pub cover_image: Option<Vec<u8>>,
    pub description: String,
    pub starts_at: NaiveDateTime,
    pub ends_at: NaiveDateTime,
    pub published: bool,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

#[derive(FromForm, Deserialize)]
pub struct UpdateCampaignInput {
    pub name: String,
    pub cover_image: Option<Vec<u8>>,
    pub description: String,
    pub starts_at: String,
    pub ends_at: String,
    pub published: bool,
}

#[derive(AsChangeset)]
#[table_name = "campaigns"]
pub struct UpdateCampaignChangeset {
    pub name: String,
    pub cover_image: Option<Vec<u8>>,
    pub description: String,
    pub starts_at: NaiveDateTime,
    pub ends_at: NaiveDateTime,
    pub published: bool,
}

#[derive(Insertable, Debug)]
#[table_name = "campaigns"]
pub struct NewCampaign {
    pub organisation_id: i32,
    pub name: String,
    pub cover_image: Option<Vec<u8>>,
    pub description: String,
    pub starts_at: NaiveDateTime,
    pub ends_at: NaiveDateTime,
    pub published: bool,
}

#[derive(Deserialize, Clone, Debug)]
pub struct NewCampaignInput {
    pub organisation_id: i32,
    pub name: String,
    pub cover_image: Option<Vec<u8>>,
    pub description: String,
    pub starts_at: String,
    pub ends_at: String,
    pub published: bool,
}

#[derive(Serialize)]
pub struct CampaignWithRoles {
    pub campaign: Campaign,
    pub roles: Vec<Role>,
    pub questions: Vec<Question>,
    pub applied_for: Vec<(i32, ApplicationStatus)>,
}

impl Campaign {
    pub fn get_all(conn: &PgConnection) -> Vec<Campaign> {
        use crate::database::schema::campaigns::dsl::*;

        campaigns
            .order(id.asc())
            .load(conn)
            .unwrap_or_else(|_| vec![])
    }

    /// return all campaigns that are live to all users
    pub fn get_all_public_with_roles(conn: &PgConnection, user_id: i32) -> Vec<CampaignWithRoles> {
        use crate::database::schema::campaigns::dsl::*;

        let now = Utc::now().naive_utc();
        println!("now: {}", now);
        let campaigns_vec: Vec<Campaign> = campaigns
            .filter(
                starts_at
                    .le(now)
                    .and(published.eq(true))
                    .and(ends_at.gt(now)),
            )
            .order(id.asc())
            .load(conn)
            .unwrap_or_else(|_| vec![]);

        Self::pack_roles_and_applied_to_into_campaigns_vec(conn, campaigns_vec, user_id)
    }

    fn pack_roles_and_applied_to_into_campaigns_vec(
        conn: &PgConnection,
        campaigns_vec: Vec<Campaign>,
        user_id: i32,
    ) -> Vec<CampaignWithRoles> {
        campaigns_vec
            .into_iter()
            .map(|campaign| {
                let campaign_roles = Role::get_all_from_campaign_id(&conn, campaign.id);

                let mut seen = HashSet::new();

                let questions = campaign_roles
                    .iter()
                    .map(|x| Question::get_all_from_role_id(conn, x.id).into_iter())
                    .flatten()
                    .filter(|x| {
                        if !seen.contains(&x.id) {
                            seen.insert(x.id);
                            true
                        } else {
                            false
                        }
                    })
                    .collect();

                println!("Questions for campaign {}: {:?}", campaign.name, questions);

                let applied_for: Vec<(i32, ApplicationStatus)> = campaign_roles
                    .clone()
                    .into_iter()
                    .filter_map(|role| {
                        let app = Application::get_all_from_role_id(&conn, role.id)
                            .into_iter()
                            .filter(|app| app.user_id == user_id)
                            .next()?;
                        Some((role.id, app.status))
                    })
                    .collect();

                CampaignWithRoles {
                    campaign,
                    roles: campaign_roles,
                    applied_for,
                    questions,
                }
            })
            .collect()
    }

    // return all campaigns that are live and in the past
    pub fn get_all_public_ended_with_roles(
        conn: &PgConnection,
        user_id: i32,
    ) -> Vec<CampaignWithRoles> {
        use crate::database::schema::campaigns::dsl::*;

        let now = Utc::now().naive_utc();
        let campaigns_vec: Vec<Campaign> = campaigns
            .filter(ends_at.lt(now).and(published.eq(true)))
            .order(id.asc())
            .load(conn)
            .unwrap_or_else(|_| vec![]);

        Self::pack_roles_and_applied_to_into_campaigns_vec(conn, campaigns_vec, user_id)
    }

    pub fn get_all_from_org_id(conn: &PgConnection, organisation_id_val: i32) -> Vec<Campaign> {
        use crate::database::schema::campaigns::dsl::*;

        campaigns
            .filter(organisation_id.eq(organisation_id_val))
            .order(id.asc())
            .load(conn)
            .unwrap_or_else(|_| vec![])
    }

    pub fn get_from_organisation_id(
        conn: &PgConnection,
        organisation_id_val: i32,
    ) -> Vec<Campaign> {
        use crate::database::schema::campaigns::dsl::*;

        campaigns
            .filter(organisation_id.eq(organisation_id_val))
            .order(id.asc())
            .load(conn)
            .unwrap_or_else(|_| vec![])
    }

    pub fn get_from_id(conn: &PgConnection, campaign_id: i32) -> Option<Campaign> {
        use crate::database::schema::campaigns::dsl::*;

        campaigns.filter(id.eq(campaign_id)).first(conn).ok()
    }

    pub fn update(
        conn: &PgConnection,
        campaign_id: i32,
        update_campaign: &UpdateCampaignInput,
    ) -> Option<Campaign> {
        use crate::database::schema::campaigns::dsl::*;

        let update_changeset = UpdateCampaignChangeset {
            name: update_campaign.name.clone(),
            cover_image: update_campaign.cover_image.clone(),
            description: update_campaign.description.clone(),
            starts_at: NaiveDateTime::parse_from_str(
                &update_campaign.starts_at,
                "%Y-%m-%dT%H:%M:%S",
            )
            .unwrap(),
            ends_at: NaiveDateTime::parse_from_str(&update_campaign.ends_at, "%Y-%m-%dT%H:%M:%S")
                .unwrap(),
            published: update_campaign.published,
        };

        diesel::update(campaigns.filter(id.eq(campaign_id)))
            .set(update_changeset)
            .get_result(conn)
            .ok()
    }

    pub fn create(conn: &PgConnection, new_campaign: &NewCampaignInput) -> Option<Campaign> {
        let new_campaign = NewCampaign {
            organisation_id: new_campaign.organisation_id,
            name: new_campaign.name.clone(),
            cover_image: new_campaign.cover_image.clone(),
            description: new_campaign.description.clone(),
            starts_at: NaiveDateTime::parse_from_str(&new_campaign.starts_at, "%Y-%m-%d %H:%M:%S")
                .ok()?,
            ends_at: NaiveDateTime::parse_from_str(&new_campaign.ends_at, "%Y-%m-%d %H:%M:%S")
                .ok()?,
            published: new_campaign.published,
        };

        new_campaign.insert(conn)
    }

    pub fn delete(conn: &PgConnection, campaign_id: i32) -> bool {
        use crate::database::schema::campaigns::dsl::*;

        diesel::delete(campaigns.filter(id.eq(campaign_id)))
            .execute(conn)
            .is_ok()
    }

    pub fn delete_deep(conn: &PgConnection, campaign_id: i32) -> Option<()> {
        use crate::database::schema::roles::dsl::{campaign_id as dsl_role_campaign_id, roles};

        let role_items: Vec<Role> = roles
            .filter(dsl_role_campaign_id.eq(campaign_id))
            .load(conn)
            .ok()?;

        for role in role_items {
            Role::delete_children(conn, role)?;
        }

        diesel::delete(roles.filter(dsl_role_campaign_id.eq(campaign_id)))
            .execute(conn)
            .ok();

        if !Campaign::delete(conn, campaign_id) {
            None
        } else {
            Some(())
        }
    }
}

impl NewCampaign {
    pub fn insert(&self, conn: &PgConnection) -> Option<Campaign> {
        use crate::database::schema::campaigns::dsl::*;
        self.insert_into(campaigns).get_result(conn).ok()
    }
}

#[derive(Identifiable, Queryable, Serialize, Associations, Clone, PartialEq)]
#[belongs_to(Campaign)]
pub struct Role {
    pub id: i32,
    pub campaign_id: i32,
    pub name: String,
    pub description: Option<String>,
    pub min_available: i32,
    pub max_available: i32,
    pub finalised: bool,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

#[derive(Insertable, AsChangeset, FromForm, Deserialize, Debug)]
#[table_name = "roles"]
pub struct RoleUpdate {
    pub campaign_id: i32,
    pub name: String,
    pub description: Option<String>,
    pub min_available: i32,
    pub max_available: i32,
    pub finalised: bool,
}

impl Role {
    pub fn get_all(conn: &PgConnection) -> Vec<Role> {
        use crate::database::schema::roles::dsl::*;

        roles.order(id.asc()).load(conn).unwrap_or_else(|_| vec![])
    }

    pub fn get_all_from_campaign_id(conn: &PgConnection, campaign_id_val: i32) -> Vec<Role> {
        use crate::database::schema::roles::dsl::*;

        roles
            .filter(campaign_id.eq(campaign_id_val))
            .order(id.asc())
            .load(conn)
            .unwrap_or_else(|_| vec![])
    }

    pub fn get_from_name(conn: &PgConnection, role_name: &str) -> Option<Role> {
        use crate::database::schema::roles::dsl::*;

        roles.filter(name.eq(role_name)).first(conn).ok()
    }

    pub fn get_from_id(conn: &PgConnection, role_id: i32) -> Option<Role> {
        use crate::database::schema::roles::dsl::*;

        roles.filter(id.eq(role_id)).first(conn).ok()
    }

    pub fn update(conn: &PgConnection, role_id: i32, role_update: &RoleUpdate) -> Option<Role> {
        use crate::database::schema::roles::dsl::*;

        diesel::update(roles.filter(id.eq(role_id)))
            .set(role_update)
            .get_result(conn)
            .ok()
    }

    pub fn delete(conn: &PgConnection, role_id: i32) -> bool {
        use crate::database::schema::roles::dsl::*;

        diesel::delete(roles.filter(id.eq(role_id)))
            .execute(conn)
            .is_ok()
    }

    pub fn delete_children(conn: &PgConnection, role: Role) -> Option<()> {
        use diesel::pg::expression::dsl::any;

        let question_items: Vec<Question> = questions::table
            .filter(any(questions::role_ids).eq(role.id))
            .load(conn)
            .ok()?;

        println!("Trying to delete questions");
        diesel::delete(questions::table.filter(any(questions::role_ids).eq(role.id)))
            .execute(conn)
            .ok();

        for question in question_items {
            diesel::delete(answers::table.filter(answers::question_id.eq(question.id)))
                .execute(conn)
                .ok();
        }

        let application_items: Vec<Application> = applications::table
            .filter(applications::role_id.eq(role.id))
            .load(conn)
            .ok()?;

        for application in application_items {
            Application::delete_children(conn, application)?;
        }

        diesel::delete(applications::table.filter(applications::role_id.eq(role.id)))
            .execute(conn)
            .ok();

        Some(())
    }

    pub fn delete_deep(conn: &PgConnection, role_id: i32) -> Option<()> {
        use crate::database::schema::roles::dsl::*;

        let role = roles.filter(id.eq(role_id)).first(conn).ok()?;

        Role::delete_children(conn, role)?;

        if Role::delete(conn, role_id) {
            Some(())
        } else {
            None
        }
    }
}

impl RoleUpdate {
    pub fn insert(&self, conn: &PgConnection) -> Option<Role> {
        use crate::database::schema::roles::dsl::*;

        self.insert_into(roles).get_result(conn).ok()
    }
}

#[derive(Identifiable, Queryable, Associations, PartialEq, Serialize)]
#[belongs_to(Role)]
#[belongs_to(OrganisationUser, foreign_key = "user_id")]
pub struct Application {
    pub id: i32,
    pub user_id: i32,
    pub role_id: i32,
    pub status: ApplicationStatus,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

#[derive(Insertable, FromForm, Deserialize)]
#[table_name = "applications"]
pub struct NewApplication {
    pub user_id: i32,
    pub role_id: i32,
    pub status: ApplicationStatus,
}

impl Application {
    pub fn get_all(conn: &PgConnection) -> Vec<Application> {
        use crate::database::schema::applications::dsl::*;

        applications
            .order(id.asc())
            .load(conn)
            .unwrap_or_else(|_| vec![])
    }

    pub fn get(app_id: i32, conn: &PgConnection) -> Option<Application> {
        use crate::database::schema::applications::dsl::*;

        applications.filter(id.eq(app_id)).first(conn).ok()
    }

    pub fn get_all_from_user_id(conn: &PgConnection, user_id_val: i32) -> Vec<Application> {
        use crate::database::schema::applications::dsl::*;

        applications
            .filter(user_id.eq(user_id_val))
            .order(id.asc())
            .load(conn)
            .unwrap_or_else(|_| vec![])
    }

    pub fn get_all_from_role_id(conn: &PgConnection, role_id_val: i32) -> Vec<Application> {
        use crate::database::schema::applications::dsl::*;

        applications
            .filter(role_id.eq(role_id_val))
            .order(id.asc())
            .load(conn)
            .unwrap_or_else(|_| vec![])
    }

    pub fn get_all_from_campaign_id(conn: &PgConnection, role_id_val: i32) -> Vec<Application> {
        use crate::database::schema::applications::dsl::*;

        applications
            .filter(role_id.eq(role_id_val))
            .order(id.asc())
            .load(conn)
            .unwrap_or_else(|_| vec![])
    }

    pub fn delete(conn: &PgConnection, application_id: i32) -> bool {
        use crate::database::schema::applications::dsl::*;

        diesel::delete(applications.filter(id.eq(application_id)))
            .execute(conn)
            .is_ok()
    }

    pub fn delete_children(conn: &PgConnection, application: Application) -> Option<()> {
        diesel::delete(ratings::table.filter(ratings::application_id.eq(application.id)))
            .execute(conn)
            .ok();

        diesel::delete(comments::table.filter(comments::application_id.eq(application.id)))
            .execute(conn)
            .ok();

        Some(())
    }
}

impl NewApplication {
    pub fn insert(&self, conn: &PgConnection) -> Option<Application> {
        use crate::database::schema::applications::dsl::*;

        self.insert_into(applications).get_result(conn).ok()
    }
}

#[derive(Identifiable, Queryable, PartialEq, Serialize, Debug, QueryableByName)]
#[table_name = "questions"]
pub struct Question {
    pub id: i32,
    pub role_ids: Vec<i32>,
    pub title: String,
    pub description: Option<String>,
    pub max_bytes: i32,
    pub required: bool,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

#[derive(Insertable, Serialize, Deserialize)]
#[table_name = "questions"]
pub struct NewQuestion {
    pub role_ids: Vec<i32>,
    pub title: String,
    pub description: Option<String>,
    #[serde(default)]
    pub max_bytes: i32,
    pub required: bool,
}

#[derive(Serialize)]
pub struct QuestionResponse {
    pub id: i32,
    pub role_ids: Vec<i32>,
    pub title: String,
    pub description: Option<String>,
    pub max_bytes: i32,
    pub required: bool,
}

impl std::convert::From<Question> for QuestionResponse {
    fn from(question: Question) -> Self {
        Self {
            id: question.id,
            role_ids: question.role_ids,
            title: question.title,
            description: question.description,
            max_bytes: question.max_bytes,
            required: question.required,
        }
    }
}

#[derive(FromForm, AsChangeset, Deserialize)]
#[table_name = "questions"]
pub struct UpdateQuestionInput {
    pub title: String,
    pub description: Option<String>,
    pub max_bytes: i32,
    pub required: bool,
}

impl Question {
    pub fn get_first_role(&self) -> i32 {
        *self
            .role_ids
            .get(0)
            .expect("Question should be for at least one role")
    }

    pub fn update(
        conn: &PgConnection,
        question_id: i32,
        update_question: UpdateQuestionInput,
    ) -> Option<()> {
        use crate::database::schema::questions::dsl::*;

        diesel::update(questions.filter(id.eq(question_id)))
            .set(update_question)
            .execute(conn)
            .ok()?;

        Some(())
    }

    pub fn get_all_from_role_id(conn: &PgConnection, role_id_val: i32) -> Vec<Question> {
        diesel::sql_query(&format!(
            "select * from questions where {} = any(role_ids)",
            role_id_val
        ))
        .load::<Question>(conn)
        .unwrap_or_else(|_| vec![])
    }

    pub fn delete_all_from_role_id(conn: &PgConnection, role_id_val: i32) -> bool {
        diesel::sql_query(&format!(
            "delete from questions where {} = any(role_ids)",
            role_id_val
        ))
        .execute(conn)
        .is_ok()
    }

    pub fn delete(conn: &PgConnection, question_id: i32) -> bool {
        use crate::database::schema::questions::dsl::*;

        diesel::delete(questions.filter(id.eq(question_id)))
            .execute(conn)
            .is_ok()
    }

    pub fn get_from_id(conn: &PgConnection, question_id: i32) -> Option<Self> {
        use crate::database::schema::questions::dsl::*;

        questions.filter(id.eq(question_id)).first(conn).ok()
    }
}

impl NewQuestion {
    pub fn insert(&self, conn: &PgConnection) -> Option<Question> {
        use crate::database::schema::questions::dsl::*;

        self.insert_into(questions).get_result(conn).ok()
    }
}

#[derive(Identifiable, Queryable, Associations, PartialEq, Serialize)]
#[belongs_to(Question)]
#[belongs_to(Application)]
pub struct Answer {
    pub id: i32,
    pub application_id: i32,
    pub question_id: i32,
    pub description: String,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

#[derive(Insertable, Deserialize)]
#[table_name = "answers"]
pub struct NewAnswer {
    pub application_id: i32,
    pub question_id: i32,
    pub description: String,
}

impl Answer {
    pub fn get_all(conn: &PgConnection) -> Vec<Answer> {
        use crate::database::schema::answers::dsl::*;

        answers
            .order(id.asc())
            .load(conn)
            .unwrap_or_else(|_| vec![])
    }

    pub fn get_all_from_application_id(
        conn: &PgConnection,
        application_id_val: i32,
    ) -> Vec<Answer> {
        use crate::database::schema::answers::dsl::*;

        answers
            .filter(application_id.eq(application_id_val))
            .order(id.asc())
            .load(conn)
            .unwrap_or_else(|_| vec![])
    }

    pub fn get_all_from_question_id(conn: &PgConnection, question_id_val: i32) -> Vec<Answer> {
        use crate::database::schema::answers::dsl::*;

        answers
            .filter(question_id.eq(question_id_val))
            .order(id.asc())
            .load(conn)
            .unwrap_or_else(|_| vec![])
    }

    pub fn delete(conn: &PgConnection, answer_id_val: i32) -> bool {
        use crate::database::schema::answers::dsl::*;

        diesel::delete(answers.filter(id.eq(answer_id_val)))
            .execute(conn)
            .is_ok()
    }
}

impl NewAnswer {
    pub fn insert(&self, conn: &PgConnection) -> Option<Answer> {
        use crate::database::schema::answers::dsl::*;

        self.insert_into(answers).get_result(conn).ok()
    }
}

#[derive(Identifiable, Queryable, Associations, PartialEq, Serialize)]
#[belongs_to(Application)]
#[belongs_to(OrganisationUser, foreign_key = "commenter_user_id")]
pub struct Comment {
    pub id: i32,
    pub application_id: i32,
    pub commenter_user_id: i32,
    pub description: String,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

#[derive(Insertable, FromForm)]
#[table_name = "comments"]
pub struct NewComment {
    pub application_id: i32,
    pub commenter_user_id: i32,
    pub description: String,
}

impl Comment {
    pub fn get_from_id(conn: &PgConnection, comment_id: i32) -> Option<Comment> {
        use crate::database::schema::comments::dsl::*;

        comments.filter(id.eq(comment_id)).first(conn).ok()
    }

    pub fn get_all(conn: &PgConnection) -> Vec<Comment> {
        use crate::database::schema::comments::dsl::*;

        comments
            .order(id.asc())
            .load(conn)
            .unwrap_or_else(|_| vec![])
    }

    pub fn get_all_from_application_id(
        conn: &PgConnection,
        application_id_val: i32,
    ) -> Vec<Comment> {
        use crate::database::schema::comments::dsl::*;

        comments
            .filter(application_id.eq(application_id_val))
            .order(id.asc())
            .load(conn)
            .unwrap_or_else(|_| vec![])
    }

    pub fn delete(conn: &PgConnection, comment_id_val: i32) -> bool {
        use crate::database::schema::comments::dsl::*;

        diesel::delete(comments.filter(id.eq(comment_id_val)))
            .execute(conn)
            .is_ok()
    }
}

impl NewComment {
    pub fn insert(&self, conn: &PgConnection) -> Option<Comment> {
        use crate::database::schema::comments::dsl::*;

        self.insert_into(comments).get_result(conn).ok()
    }
}

#[derive(Identifiable, Queryable, Associations, PartialEq, Serialize)]
#[belongs_to(Application)]
#[belongs_to(OrganisationUser, foreign_key = "rater_user_id")]
pub struct Rating {
    pub id: i32,
    pub application_id: i32,
    pub rater_user_id: i32,
    pub rating: i32,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
}

#[derive(Insertable)]
#[table_name = "ratings"]
pub struct NewRating {
    pub application_id: i32,
    pub rater_user_id: i32,
    pub rating: i32,
}

impl Rating {
    pub fn get_all(conn: &PgConnection) -> Vec<Rating> {
        use crate::database::schema::ratings::dsl::*;

        ratings
            .order(id.asc())
            .load(conn)
            .unwrap_or_else(|_| vec![])
    }

    pub fn get_all_from_application_id(
        conn: &PgConnection,
        application_id_val: i32,
    ) -> Vec<Rating> {
        use crate::database::schema::ratings::dsl::*;

        ratings
            .filter(application_id.eq(application_id_val))
            .order(id.asc())
            .load(conn)
            .unwrap_or_else(|_| vec![])
    }

    pub fn get_all_from_rater_user_id(conn: &PgConnection, user_id_val: i32) -> Vec<Rating> {
        use crate::database::schema::ratings::dsl::*;

        ratings
            .filter(rater_user_id.eq(user_id_val))
            .order(id.asc())
            .load(conn)
            .unwrap_or_else(|_| vec![])
    }

    pub fn delete(conn: &PgConnection, rating_id_val: i32) -> bool {
        use crate::database::schema::ratings::dsl::*;
        diesel::delete(ratings.filter(id.eq(rating_id_val)))
            .execute(conn)
            .is_ok()
    }
}

impl NewRating {
    pub fn insert(&self, conn: &PgConnection) -> Option<Rating> {
        use crate::database::schema::ratings::dsl::*;

        self.insert_into(ratings).get_result(conn).ok()
    }
}

#[derive(Serialize)]
pub struct GetQuestionsResponse {
    pub questions: Vec<QuestionResponse>,
}

#[derive(Serialize)]
pub struct CampaignInfo {
    pub id: i32,
    pub name: String,
    pub cover_image: Option<Vec<u8>>,
    pub starts_at: NaiveDateTime,
    pub ends_at: NaiveDateTime,
}

impl std::convert::From<Campaign> for CampaignInfo {
    fn from(campaign: Campaign) -> Self {
        Self {
            id: campaign.id,
            name: campaign.name,
            cover_image: campaign.cover_image,
            starts_at: campaign.starts_at,
            ends_at: campaign.ends_at,
        }
    }
}

#[derive(Serialize)]
pub struct OrganisationUserInfo {
    pub id: i32,
    pub display_name: String,
    pub role: AdminLevel,
}

impl OrganisationUserInfo {
    pub fn get_all_from_organisation_id(
        conn: &PgConnection,
        organisation_id_val: i32,
    ) -> Vec<OrganisationUserInfo> {
        use crate::database::schema::organisation_users::dsl::*;

        organisation_users
            .filter(organisation_id.eq(organisation_id_val))
            .order(id.asc())
            .load(conn)
            .unwrap_or_else(|_| vec![])
            .into_iter()
            .map(|o: OrganisationUser| {
                let user = User::get_from_id(conn, o.user_id).unwrap();
                Self {
                    id: o.user_id,
                    display_name: user.display_name,
                    role: o.admin_level,
                }
            })
            .collect()
    }
}

#[derive(Serialize)]
pub struct OrganisationInfo {
    pub id: i32,
    pub name: String,
    pub logo: Option<Vec<u8>>,
    pub members: Vec<OrganisationUserInfo>,
    pub campaigns: Vec<CampaignInfo>,
}

impl OrganisationInfo {
    pub fn new(organisation_id: i32, conn: &PgConnection) -> Self {
        let organisation = Organisation::get_from_id(conn, organisation_id).unwrap();
        Self {
            id: organisation.id,
            name: organisation.name,
            logo: organisation.logo,
            members: OrganisationUserInfo::get_all_from_organisation_id(conn, organisation.id),
            campaigns: Campaign::get_all_from_org_id(conn, organisation.id)
                .into_iter()
                .map(|c: Campaign| CampaignInfo::from(c))
                .collect(),
        }
    }
}

#[derive(Serialize)]
pub struct AdminInfoResponse {
    pub organisations: Vec<OrganisationInfo>,
}
