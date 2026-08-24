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

use crate::spicedb::SpiceDbPolicy;

/// Edit organisation settings
pub struct ManageOrganisation;
impl SpiceDbPolicy for ManageOrganisation {
    const RESOURCE_TYPE: &'static str = "chaos/organisation";
    const PERMISSION: &'static str = "manage";
    const PATH_PARAMETER: &'static str = "organisation_id";
}

/// View organisation in dashboard
pub struct ViewOrganisation;
impl SpiceDbPolicy for ViewOrganisation {
    const RESOURCE_TYPE: &'static str = "chaos/organisation";
    const PERMISSION: &'static str = "view";
    const PATH_PARAMETER: &'static str = "organisation_id";
}

/// Edit campaign settings & questions
pub struct ManageCampaign;
impl SpiceDbPolicy for ManageCampaign {
    const RESOURCE_TYPE: &'static str = "chaos/campaign";
    const PERMISSION: &'static str = "manage";
    const PATH_PARAMETER: &'static str = "campaign_id";
}

/// View campaign details and applications in dashboard
pub struct ReviewCampaign;
impl SpiceDbPolicy for ReviewCampaign {
    const RESOURCE_TYPE: &'static str = "chaos/campaign";
    const PERMISSION: &'static str = "review";
    const PATH_PARAMETER: &'static str = "campaign_id";
}

/// View application answers
pub struct ViewApplication;
impl SpiceDbPolicy for ViewApplication {
    const RESOURCE_TYPE: &'static str = "chaos/application";
    const PERMISSION: &'static str = "view";
    const PATH_PARAMETER: &'static str = "application_id";
}

/// Edit application answers
pub struct EditApplication;
impl SpiceDbPolicy for EditApplication {
    const RESOURCE_TYPE: &'static str = "chaos/application";
    const PERMISSION: &'static str = "edit";
    const PATH_PARAMETER: &'static str = "application_id";
}

/// View application answers, rate application, comment
pub struct ReviewApplication;
impl SpiceDbPolicy for ReviewApplication {
    const RESOURCE_TYPE: &'static str = "chaos/application";
    const PERMISSION: &'static str = "review";
    const PATH_PARAMETER: &'static str = "application_id";
}


/// Edit application rating
pub struct EditRating;
impl SpiceDbPolicy for EditRating {
    const RESOURCE_TYPE: &'static str = "chaos/rating";
    const PERMISSION: &'static str = "edit";
    const PATH_PARAMETER: &'static str = "rating_id";
}

/// View application rating
pub struct ViewRating;
impl SpiceDbPolicy for ViewRating {
    const RESOURCE_TYPE: &'static str = "chaos/rating";
    const PERMISSION: &'static str = "view";
    const PATH_PARAMETER: &'static str = "rating_id";
}

/// Edit application comment
pub struct EditComment;
impl SpiceDbPolicy for EditComment {
    const RESOURCE_TYPE: &'static str = "chaos/comment";
    const PERMISSION: &'static str = "edit";
    const PATH_PARAMETER: &'static str = "comment_id";
}

/// View application comment
pub struct ViewComment;
impl SpiceDbPolicy for ViewComment {
    const RESOURCE_TYPE: &'static str = "chaos/comment";
    const PERMISSION: &'static str = "view";
    const PATH_PARAMETER: &'static str = "comment_id";
}

/// Manage offer
pub struct ManageOffer;
impl SpiceDbPolicy for ManageOffer {
    const RESOURCE_TYPE: &'static str = "chaos/offer";
    const PERMISSION: &'static str = "manage";
    const PATH_PARAMETER: &'static str = "offer_id";
}

/// View offer
pub struct ViewOffer;
impl SpiceDbPolicy for ViewOffer {
    const RESOURCE_TYPE: &'static str = "chaos/offer";
    const PERMISSION: &'static str = "view";
    const PATH_PARAMETER: &'static str = "offer_id";
}