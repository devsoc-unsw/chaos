//! Reusable SpiceDB authorization policies for HTTP handlers.
//!
//! Each policy is a zero-sized type implementing [`SpiceDbPolicy`]. Pass it as
//! the type parameter of the [`SpiceDbAuth`] extractor to authorize a request,
//! e.g. `_auth: SpiceDbAuth<ManageCampaign>`.
//!
//! To authorize a new handler, reuse a policy below or add a new one (a struct
//! plus a [`SpiceDbPolicy`] impl), then add the extractor to the handler
//! signature. Compound rules such as "owner or reviewer" belong in the SpiceDB
//! schema as a single permission (e.g. `view = creator + campaign->review`)
//! rather than in a policy. When the resource ID is not a path parameter,
//! call [`AppState::check_permission`] directly in the handler instead.
//!
//! [`SpiceDbPolicy`]: crate::spicedb::SpiceDbPolicy
//! [`SpiceDbAuth`]: crate::spicedb::SpiceDbAuth
//! [`AppState::check_permission`]: crate::models::app::AppState::check_permission

use crate::spicedb::{schema, SpiceDbPolicy};

/// Manage platform
pub struct ManagePlatform;
impl SpiceDbPolicy for ManagePlatform {
    const RESOURCE_TYPE: &'static str = schema::resource::PLATFORM;
    const PERMISSION: &'static str = schema::permission::platform::MANAGE;
    const PATH_PARAMETER: &'static str = "not_applicable";
}

/// Use platform (any logged-in user)
pub struct UsePlatform;
impl SpiceDbPolicy for UsePlatform {
    const RESOURCE_TYPE: &'static str = schema::resource::PLATFORM;
    const PERMISSION: &'static str = schema::permission::platform::USE;
    const PATH_PARAMETER: &'static str = "not_applicable";
}

/// Edit organisation settings
pub struct ManageOrganisation;
impl SpiceDbPolicy for ManageOrganisation {
    const RESOURCE_TYPE: &'static str = schema::resource::ORGANISATION;
    const PERMISSION: &'static str = schema::permission::organisation::MANAGE;
    const PATH_PARAMETER: &'static str = "organisation_id";
}

/// View organisation in dashboard
pub struct ViewOrganisation;
impl SpiceDbPolicy for ViewOrganisation {
    const RESOURCE_TYPE: &'static str = schema::resource::ORGANISATION;
    const PERMISSION: &'static str = schema::permission::organisation::VIEW;
    const PATH_PARAMETER: &'static str = "organisation_id";
}

/// Manage email template
pub struct ManageEmailTemplate;
impl SpiceDbPolicy for ManageEmailTemplate {
    const RESOURCE_TYPE: &'static str = schema::resource::EMAIL_TEMPLATE;
    const PERMISSION: &'static str = schema::permission::email_template::MANAGE;
    const PATH_PARAMETER: &'static str = "template_id";
}

/// View email template
pub struct ViewEmailTemplate;
impl SpiceDbPolicy for ViewEmailTemplate {
    const RESOURCE_TYPE: &'static str = schema::resource::EMAIL_TEMPLATE;
    const PERMISSION: &'static str = schema::permission::email_template::VIEW;
    const PATH_PARAMETER: &'static str = "template_id";
}

/// Edit campaign settings & questions
pub struct ManageCampaign;
impl SpiceDbPolicy for ManageCampaign {
    const RESOURCE_TYPE: &'static str = schema::resource::CAMPAIGN;
    const PERMISSION: &'static str = schema::permission::campaign::MANAGE;
    const PATH_PARAMETER: &'static str = "campaign_id";
}

/// View campaign details and applications in dashboard
pub struct ReviewCampaign;
impl SpiceDbPolicy for ReviewCampaign {
    const RESOURCE_TYPE: &'static str = schema::resource::CAMPAIGN;
    const PERMISSION: &'static str = schema::permission::campaign::REVIEW;
    const PATH_PARAMETER: &'static str = "campaign_id";
}

/// Manage campaign role
pub struct ManageCampaignRole;
impl SpiceDbPolicy for ManageCampaignRole {
    const RESOURCE_TYPE: &'static str = schema::resource::CAMPAIGN_ROLE;
    const PERMISSION: &'static str = schema::permission::campaign_role::MANAGE;
    const PATH_PARAMETER: &'static str = "role_id";
}

/// View application answers
pub struct ViewApplication;
impl SpiceDbPolicy for ViewApplication {
    const RESOURCE_TYPE: &'static str = schema::resource::APPLICATION;
    const PERMISSION: &'static str = schema::permission::application::VIEW;
    const PATH_PARAMETER: &'static str = "application_id";
}

/// Edit application answers
pub struct EditApplication;
impl SpiceDbPolicy for EditApplication {
    const RESOURCE_TYPE: &'static str = schema::resource::APPLICATION;
    const PERMISSION: &'static str = schema::permission::application::EDIT;
    const PATH_PARAMETER: &'static str = "application_id";
}

/// View application answers, rate application, comment
pub struct ReviewApplication;
impl SpiceDbPolicy for ReviewApplication {
    const RESOURCE_TYPE: &'static str = schema::resource::APPLICATION;
    const PERMISSION: &'static str = schema::permission::application::REVIEW;
    const PATH_PARAMETER: &'static str = "application_id";
}

/// Edit application rating
pub struct EditRating;
impl SpiceDbPolicy for EditRating {
    const RESOURCE_TYPE: &'static str = schema::resource::RATING;
    const PERMISSION: &'static str = schema::permission::rating::EDIT;
    const PATH_PARAMETER: &'static str = "rating_id";
}

/// View application rating
pub struct ViewRating;
impl SpiceDbPolicy for ViewRating {
    const RESOURCE_TYPE: &'static str = schema::resource::RATING;
    const PERMISSION: &'static str = schema::permission::rating::VIEW;
    const PATH_PARAMETER: &'static str = "rating_id";
}

/// Edit application comment
pub struct EditComment;
impl SpiceDbPolicy for EditComment {
    const RESOURCE_TYPE: &'static str = schema::resource::COMMENT;
    const PERMISSION: &'static str = schema::permission::comment::EDIT;
    const PATH_PARAMETER: &'static str = "comment_id";
}

/// View application comment
pub struct ViewComment;
impl SpiceDbPolicy for ViewComment {
    const RESOURCE_TYPE: &'static str = schema::resource::COMMENT;
    const PERMISSION: &'static str = schema::permission::comment::VIEW;
    const PATH_PARAMETER: &'static str = "comment_id";
}

/// Manage offer
pub struct ManageOffer;
impl SpiceDbPolicy for ManageOffer {
    const RESOURCE_TYPE: &'static str = schema::resource::OFFER;
    const PERMISSION: &'static str = schema::permission::offer::MANAGE;
    const PATH_PARAMETER: &'static str = "offer_id";
}

/// View offer
pub struct ViewOffer;
impl SpiceDbPolicy for ViewOffer {
    const RESOURCE_TYPE: &'static str = schema::resource::OFFER;
    const PERMISSION: &'static str = schema::permission::offer::VIEW;
    const PATH_PARAMETER: &'static str = "offer_id";
}

/// Reply to an offer as its recipient
pub struct ReplyOffer;
impl SpiceDbPolicy for ReplyOffer {
    const RESOURCE_TYPE: &'static str = schema::resource::OFFER;
    const PERMISSION: &'static str = schema::permission::offer::REPLY;
    const PATH_PARAMETER: &'static str = "offer_id";
}

/// Edit application answer
pub struct EditAnswer;
impl SpiceDbPolicy for EditAnswer {
    const RESOURCE_TYPE: &'static str = schema::resource::ANSWER;
    const PERMISSION: &'static str = schema::permission::answer::EDIT;
    const PATH_PARAMETER: &'static str = "answer_id";
}
