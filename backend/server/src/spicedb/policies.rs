//! Reusable SpiceDB authorization policies for HTTP handlers.

crate::spicedb_policy!(
    ManageOrganisation,
    resource = "chaos/organisation",
    permission = "manage",
    path = "organisation_id"
);

crate::spicedb_policy!(
    ManageCampaign,
    resource = "chaos/campaign",
    permission = "manage",
    path = "campaign_id"
);

crate::spicedb_policy!(
    ReviewApplication,
    resource = "chaos/application",
    permission = "review",
    path = "application_id"
);

crate::spicedb_policy!(
    EditApplication,
    resource = "chaos/application",
    permission = "edit",
    path = "application_id"
);
