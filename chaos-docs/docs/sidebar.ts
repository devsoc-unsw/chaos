import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebar: SidebarsConfig = {
  apisidebar: [
    {
      type: "doc",
      id: "chaos-api",
    },
    {
      type: "category",
      label: "Auth",
      items: [
        {
          type: "doc",
          id: "logout",
          label: "logout",
          className: "api-method post",
        },
      ],
    },
    {
      type: "category",
      label: "User",
      items: [
        {
          type: "doc",
          id: "get-logged-in-user",
          label: "getLoggedInUser",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "delete-user-by-id",
          label: "deleteUserById",
          className: "api-method delete",
        },
        {
          type: "doc",
          id: "get-user-by-id",
          label: "getUserById",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "update-user-name",
          label: "updateUserName",
          className: "api-method patch",
        },
        {
          type: "doc",
          id: "update-user-zid",
          label: "updateUserZid",
          className: "api-method patch",
        },
        {
          type: "doc",
          id: "update-user-degree",
          label: "updateUserDegree",
          className: "api-method patch",
        },
      ],
    },
    {
      type: "category",
      label: "Organisation",
      items: [
        {
          type: "doc",
          id: "create-organisation",
          label: "createOrganisation",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "get-organisation-by-id",
          label: "getOrganisationById",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "delete-organisation-by-id",
          label: "deleteOrganisationById",
          className: "api-method delete",
        },
        {
          type: "doc",
          id: "get-organisation-campaigns-by-id",
          label: "getOrganisationCampaignsById",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "update-organisation-logo-by-id",
          label: "updateOrganisationLogoById",
          className: "api-method patch",
        },
        {
          type: "doc",
          id: "get-organisation-members-by-id",
          label: "getOrganisationMembersById",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "update-organisation-members-by-id",
          label: "updateOrganisationMembersById",
          className: "api-method put",
        },
        {
          type: "doc",
          id: "create-campaign",
          label: "createCampaign",
          className: "api-method post",
        },
      ],
    },
    {
      type: "category",
      label: "Campaign",
      items: [
        {
          type: "doc",
          id: "get-all-campaigns",
          label: "getAllCampaigns",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "get-campaign-by-id",
          label: "getCampaignById",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "update-campaign-by-id",
          label: "updateCampaignById",
          className: "api-method put",
        },
        {
          type: "doc",
          id: "delete-campaign-by-id",
          label: "deleteCampaignById",
          className: "api-method delete",
        },
        {
          type: "doc",
          id: "update-campaign-banner-by-id",
          label: "updateCampaignBannerById",
          className: "api-method patch",
        },
        {
          type: "doc",
          id: "create-role",
          label: "createRole",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "get-roles-by-campaign-id",
          label: "getRolesByCampaignId",
          className: "api-method get",
        },
      ],
    },
    {
      type: "category",
      label: "Role",
      items: [
        {
          type: "doc",
          id: "get-role-by-id",
          label: "getRoleById",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "update-role-by-id",
          label: "updateRoleById",
          className: "api-method put",
        },
        {
          type: "doc",
          id: "delete-role-by-id",
          label: "deleteRoleById",
          className: "api-method delete",
        },
      ],
    },
  ],
};

export default sidebar.apisidebar;
