/* eslint-disable camelcase */
import { getStore } from "../utils";
import API from "./api";

export const authenticate = async (oauthToken) =>
  API.request({
    method: "POST",
    path: `/auth/signin`,
    body: {
      oauth_token: oauthToken,
    },
  });

export const doSignup = async ({ name, degree_name, zid, starting_year }) =>
  API.request({
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

const authenticatedRequest = (payload) => {
  const token = `Bearer ${getStore("AUTH_TOKEN")}`;
  return API.request({
    ...payload,
    header: {
      Authorization: token,
      ...payload.header,
    },
  });
};

export const getAllCampaigns = () =>
  authenticatedRequest({ path: "/campaign/all" });

export const isAdminInOrganisation = (orgId) =>
  authenticatedRequest({ path: `/organisation/${orgId}/is_admin` });

export const getAdminData = () => authenticatedRequest({ path: "/admin" });

export const createOrganisation = (name, logo) =>
  authenticatedRequest({
    method: "POST",
    path: "/organisation/new",
    body: { name, logo },
  });

export const newApplication = (roleId) =>
  authenticatedRequest({
    method: "POST",
    path: "/application/new",
    body: { role_id: roleId, status: "Pending" },
  });

export const doDeleteOrg = (orgId) =>
  authenticatedRequest({
    method: "DELETE",
    path: `/organisation/${orgId}`,
  });

export const getCampaignRoles = (campaignId) =>
  authenticatedRequest({ path: `/campaign/${campaignId}/roles` });

export const getRoleApplications = (roleId) =>
  authenticatedRequest({ path: `/role/${roleId}/applications` });

export const getRoleQuestions = (roleId) =>
  authenticatedRequest({ path: `/role/${roleId}/questions` });

export const setApplicationRating = (applicationId, rating) =>
  authenticatedRequest({
    method: "PUT",
    path: `/application/${applicationId}/rating`,
    body: {
      rating,
    },
  });

export const getSelfInfo = () => authenticatedRequest({ path: "/user" });

export const getApplicationAnswers = (applicationId) =>
  authenticatedRequest({ path: `/application/${applicationId}/answers` });

export const getApplicationRatings = (applicationId) =>
  authenticatedRequest({ path: `/application/${applicationId}/ratings` });

export const submitAnswer = (applicationId, questionId, description) =>
  authenticatedRequest({
    method: "POST",
    path: `/application/answer/`,
    body: {
      application_id: applicationId,
      question_id: questionId,
      description,
    },
  });

export const createCampaign = (campaign, roles, questions) =>
  authenticatedRequest({
    method: "POST",
    path: "/campaign",
    body: { campaign, roles, questions },
  });

export const setApplicationStatus = (applicationId, status) =>
  authenticatedRequest({
    method: "PUT",
    path: `/application/${applicationId}/status`,
    body: status,
  });
