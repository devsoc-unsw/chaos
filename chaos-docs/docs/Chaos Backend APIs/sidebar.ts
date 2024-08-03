import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebar: SidebarsConfig = {
  apisidebar: [
    {
      type: "doc",
      id: "Chaos Backend APIs/chaos-api",
    },
    {
      type: "category",
      label: "Auth",
      items: [
        {
          type: "doc",
          id: "Chaos Backend APIs/logout",
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
          id: "Chaos Backend APIs/get-logged-in-user",
          label: "getLoggedInUser",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "Chaos Backend APIs/delete-user-by-id",
          label: "deleteUserById",
          className: "api-method delete",
        },
        {
          type: "doc",
          id: "Chaos Backend APIs/get-user-by-id",
          label: "getUserById",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "Chaos Backend APIs/update-user-name",
          label: "updateUserName",
          className: "api-method patch",
        },
        {
          type: "doc",
          id: "Chaos Backend APIs/update-user-zid",
          label: "updateUserZid",
          className: "api-method patch",
        },
        {
          type: "doc",
          id: "Chaos Backend APIs/update-user-degree",
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
          id: "Chaos Backend APIs/create-organisation",
          label: "createOrganisation",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "Chaos Backend APIs/get-organisation-by-id",
          label: "getOrganisationById",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "Chaos Backend APIs/delete-organisation-by-id",
          label: "deleteOrganisationById",
          className: "api-method delete",
        },
        {
          type: "doc",
          id: "Chaos Backend APIs/get-organisation-campaigns-by-id",
          label: "getOrganisationCampaignsById",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "Chaos Backend APIs/update-organisation-logo-by-id",
          label: "updateOrganisationLogoById",
          className: "api-method patch",
        },
        {
          type: "doc",
          id: "Chaos Backend APIs/get-organisation-members-by-id",
          label: "getOrganisationMembersById",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "Chaos Backend APIs/update-organisation-members-by-id",
          label: "updateOrganisationMembersById",
          className: "api-method put",
        },
        {
          type: "doc",
          id: "Chaos Backend APIs/create-campaign",
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
          id: "Chaos Backend APIs/get-all-campaigns",
          label: "getAllCampaigns",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "Chaos Backend APIs/get-campaign-by-id",
          label: "getCampaignById",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "Chaos Backend APIs/update-campaign-by-id",
          label: "updateCampaignById",
          className: "api-method put",
        },
        {
          type: "doc",
          id: "Chaos Backend APIs/delete-campaign-by-id",
          label: "deleteCampaignById",
          className: "api-method delete",
        },
        {
          type: "doc",
          id: "Chaos Backend APIs/update-campaign-banner-by-id",
          label: "updateCampaignBannerById",
          className: "api-method patch",
        },
        {
          type: "doc",
          id: "Chaos Backend APIs/create-role",
          label: "createRole",
          className: "api-method post",
        },
        {
          type: "doc",
          id: "Chaos Backend APIs/get-roles-by-campaign-id",
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
          id: "Chaos Backend APIs/get-role-by-id",
          label: "getRoleById",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "Chaos Backend APIs/update-role-by-id",
          label: "updateRoleById",
          className: "api-method put",
        },
        {
          type: "doc",
          id: "Chaos Backend APIs/delete-role-by-id",
          label: "deleteRoleById",
          className: "api-method delete",
        },
      ],
    },
  ],
};

export default sidebar.apisidebar;
