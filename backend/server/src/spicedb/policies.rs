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

/// Permits organisation admins to manage the organisation identified by the
/// `organisation_id` path parameter.
pub struct ManageOrganisation;

impl SpiceDbPolicy for ManageOrganisation {
    const RESOURCE_TYPE: &'static str = "chaos/organisation";
    const PERMISSION: &'static str = "manage";
    const PATH_PARAMETER: &'static str = "organisation_id";
}

/// Permits campaign admins (admins of the owning organisation) to manage the
/// campaign identified by the `campaign_id` path parameter.
pub struct ManageCampaign;

impl SpiceDbPolicy for ManageCampaign {
    const RESOURCE_TYPE: &'static str = "chaos/campaign";
    const PERMISSION: &'static str = "manage";
    const PATH_PARAMETER: &'static str = "campaign_id";
}

/// Permits members of the owning organisation to review the application
/// identified by the `application_id` path parameter.
pub struct ReviewApplication;

impl SpiceDbPolicy for ReviewApplication {
    const RESOURCE_TYPE: &'static str = "chaos/application";
    const PERMISSION: &'static str = "review";
    const PATH_PARAMETER: &'static str = "application_id";
}

/// Permits the creator of the application identified by the `application_id`
/// path parameter to edit it.
pub struct EditApplication;

impl SpiceDbPolicy for EditApplication {
    const RESOURCE_TYPE: &'static str = "chaos/application";
    const PERMISSION: &'static str = "edit";
    const PATH_PARAMETER: &'static str = "application_id";
}
