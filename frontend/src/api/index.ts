/* eslint-disable camelcase */
import { getStore } from "../utils";

import API from "./api";

import type {
  Application,
  ApplicationAnswer,
  ApplicationRating,
  ApplicationResponse,
  ApplicationStatus,
  AuthenticateResponse,
  Campaign,
  CampaignWithRoles,
  NewCampaignInput,
  Organisation,
  OrganisationInfo,
  QuestionInput,
  QuestionResponse,
  Role,
  RoleInput,
  UserResponse,
} from "../types/api";

export const authenticate = async (oauthToken: string) =>
  API.request<AuthenticateResponse>({
    method: "POST",
    path: `/auth/signin`,
    body: {
      oauth_token: oauthToken,
    },
  });

export const doSignup = async ({
  name,
  degree_name,
  zid,
  starting_year,
}: {
  name: string;
  degree_name: string;
  zid: string;
  starting_year: number;
}) =>
  API.request<{ token: string }>({
    method: "POST",
    path: `/auth/signup`,
    body: {
      signup_token: getStore("signup_token"),
      zid,
      display_name: name,
      degree_starting_year: starting_year,
      degree_name,
    },
  });

// const authenticatedRequest = () => {
//   const token = `Bearer ${localStorage.getItem("AUTH_TOKEN")}`;
//   return {
//     getUser: async () =>
//       API.request({
//         path: "/user",
//         header: {
//           "Content-Type": "application/json",
//           Authorization: token,
//         },
//       }),
//   };
// };

const authenticatedRequest = <T = void>(
  payload: Parameters<typeof API.request<T>>[0]
) => {
  const token = `Bearer ${getStore("AUTH_TOKEN")}`;
  return API.request<T>({
    ...payload,
    header: {
      Authorization: token,
      ...payload.header,
    },
  });
};

export const getAllCampaigns = () =>
  authenticatedRequest<{
    current_campaigns: CampaignWithRoles[];
    past_campaigns: CampaignWithRoles[];
  }>({
    path: "/campaign/all",
  });

export const isAdminInOrganisation = (orgId: number) =>
  authenticatedRequest<boolean>({ path: `/organisation/${orgId}/is_admin` });

export const getAdminData = () =>
  authenticatedRequest<{ organisations: OrganisationInfo[] }>({
    path: "/admin",
  });

export const createOrganisation = (name: string, logo: number[]) =>
  authenticatedRequest<Organisation>({
    method: "POST",
    path: "/organisation/new",
    body: { name, logo },
  });

export const newApplication = (roleId: number) =>
  authenticatedRequest<Application>({
    method: "POST",
    path: "/application/new",
    body: { role_id: roleId, status: "Pending" },
  });

export const doDeleteOrg = (orgId: number) =>
  authenticatedRequest({
    method: "DELETE",
    path: `/organisation/${orgId}`,
    jsonResp: false,
  });

export const getCampaign = (campaignId: number) =>
  authenticatedRequest<Campaign>({ path: `/campaign/${campaignId}` });

export const getCampaignRoles = (campaignId: number) =>
  authenticatedRequest<{ roles: Role[] }>({
    path: `/campaign/${campaignId}/roles`,
  });

export const getRoleApplications = (roleId: number) =>
  authenticatedRequest<{ applications: ApplicationResponse[] }>({
    path: `/role/${roleId}/applications`,
  });

export const getRoleQuestions = (roleId: number) =>
  authenticatedRequest<{ questions: QuestionResponse[] }>({
    path: `/role/${roleId}/questions`,
  });

export const setApplicationRating = (applicationId: number, rating: number) =>
  authenticatedRequest({
    method: "PUT",
    path: `/application/${applicationId}/rating`,
    body: {
      rating,
    },
    jsonResp: false,
  });

export const getSelfInfo = () =>
  authenticatedRequest<UserResponse>({ path: "/user" });

export const getApplicationAnswers = (applicationId: number) =>
  authenticatedRequest<{ answers: ApplicationAnswer[] }>({
    path: `/application/${applicationId}/answers`,
  });

export const getApplicationRatings = (applicationId: number) =>
  authenticatedRequest<{ ratings: ApplicationRating[] }>({
    path: `/application/${applicationId}/ratings`,
  });

export const submitAnswer = (
  applicationId: number,
  questionId: number,
  description: string
) =>
  authenticatedRequest({
    method: "POST",
    path: `/application/answer/`,
    body: {
      application_id: applicationId,
      question_id: questionId,
      description,
    },
    jsonResp: false,
  });

export const createCampaign = (
  campaign: NewCampaignInput,
  roles: RoleInput[],
  questions: QuestionInput[]
) =>
  authenticatedRequest<Campaign>({
    method: "POST",
    path: "/campaign",
    body: { campaign, roles, questions },
  });

export const deleteCampaign = (id: number) =>
  authenticatedRequest({
    method: "DELETE",
    path: `/campaign/${id}`,
    jsonResp: false,
  });

export const setApplicationStatus = (
  applicationId: number,
  status: ApplicationStatus
) =>
  authenticatedRequest({
    method: "PUT",
    path: `/application/${applicationId}/status`,
    body: status,
    jsonResp: false,
  });

export const inviteUserToOrg = (
  email: string,
  organisationId: number,
  adminLevel = "ReadOnly"
) =>
  authenticatedRequest({
    method: "POST",
    path: `/organisation/${organisationId}/invite`,
    body: {
      email,
      admin_level: adminLevel,
    },
    jsonResp: false,
  });
