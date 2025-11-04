/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable camelcase */
import { getStore } from "../utils";

import API from "./api";

import {
  type Application,
  type ApplicationAnswer,
  type ApplicationRating,
  type ApplicationResponse,
  type ApplicationStatus,
  type AuthenticateResponse,
  type Campaign,
  type CampaignWithRoles,
  type Member,
  type NewCampaignInput,
  type Organisation,
  type OrganisationInfo,
  type OrganisationRole,
  type QuestionInput,
  type QuestionResponse,
  type Role,
  type RoleApplications,
  type RoleInput,
  type UserGender,
  type User,
  type newOrganisation,
  type NewApplication,
  type ApplicationDetails,
  type NewRating,
  type Answer,
  QuestionType,
  AnswerData,
  type ApplicationRoleUpdateInput,
  type ApplicationRole,
  type OrganisationRole as OrgRoleType,
} from "../types/api";

// todo: update to new route
export const authenticate = async (oauthToken: string) =>
  API.request<AuthenticateResponse>({
    method: "POST",
    path: `/auth/signin`,
    body: {
      oauth_token: oauthToken,
    },
  });

// todo: update to new route
export const doSignup = async ({
  name,
  degree_name,
  zid,
  starting_year,
  gender,
  pronouns,
}: {
  name: string;
  degree_name: string;
  zid: string;
  starting_year: number;
  gender: UserGender;
  pronouns: string;
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
      gender,
      pronouns,
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

// Cookies-based approach - HTTP-only cookies are automatically sent with requests
const authenticatedRequest = <T = void>(
  payload: Parameters<typeof API.request<T>>[0]
) => {
  // With HTTP-only cookies, we don't need to manually add the Authorization header
  // The cookie will be automatically sent with the request
  return API.request<T>(payload);
};

// todo: update to new route
export const getAllCampaigns = () =>
  authenticatedRequest<Campaign[]>({
    path: "/v1/campaigns",
  });

export const getAdminData = (organisationId: string) =>
  authenticatedRequest<{ members: Member[] }>({
    path: `/v1/organisation/${organisationId}/admins`,
  });

// todo: create backend route + update referencing components
export const getAdminOrgs = () =>
  authenticatedRequest<Organisation[]>({
    path: "/v1/user/organisations",
  });

export const getOrganisation = (organisationId: string) =>
  authenticatedRequest<Organisation>({
    path: `/v1/organisation/${organisationId}`,
  });

export const getOrganisationBySlug = (organisationSlug: string) =>
  authenticatedRequest<Organisation>({
    path: `/v1/organisation/slug/${organisationSlug}`,
  });

// todo: update all referencing components
export const createOrganisation = (orgData: newOrganisation) =>
  authenticatedRequest<Organisation>({
    method: "POST",
    path: "/v1/organisation/",
    body: { orgData },
  });

export const putOrgLogo = async (orgId: string, logo: File) => {
  const presignedUrl = await authenticatedRequest<string>({
    method: "PATCH",
    path: `/v1/organisation/${orgId}/logo`,
  });

  return fetch(presignedUrl, {
    method: "PUT",
    headers: {
      "Content-Type": logo.type,
    },
    body: logo,
  });
};

export const newApplication = (campaignId: string, newApp: NewApplication) =>
  authenticatedRequest<Application>({
    method: "POST",
    path: `/v1/campaign/${campaignId}/application/`,
    body: newApp,
  });

export const doDeleteOrg = (orgId: string) =>
  authenticatedRequest({
    method: "DELETE",
    path: `/v1/organisation/${orgId}`,
    jsonResp: false,
  });

export const getCampaign = (campaignId: string) =>
  authenticatedRequest<Campaign>({ path: `/v1/campaign/${campaignId}` });

export const getCampaignBySlugs = (
  organisationSlug: string,
  campaignSlug: string
) =>
  authenticatedRequest<Campaign>({
    path: `/v1/campaign/slug/${organisationSlug}/${campaignSlug}`,
  });

// Preferred explicit path for organisation + campaign slugs
export const getCampaignByOrgAndCampaignSlugs = (
  organisationSlug: string,
  campaignSlug: string
) =>
  authenticatedRequest<Campaign>({
    path: `/v1/organisation/slug/${organisationSlug}/campaign/slug/${campaignSlug}`,
  });

export const getCampaignRoles = (campaignId: string) =>
  authenticatedRequest<Role[]>({
    path: `/v1/campaign/${campaignId}/roles`,
  });

export const getRoleApplications = (roleId: string) =>
  authenticatedRequest<ApplicationDetails[]>({
    path: `/v1/role/${roleId}/applications`,
  });

export const getRoleQuestions = (campaignId: string, roleId: string) =>
  authenticatedRequest<QuestionResponse[]>({
    path: `/v1/campaign/${campaignId}/role/${roleId}/questions`,
  });

// todo: update all referencing components
export const getCommonQuestions = (campaignID: string) =>
  authenticatedRequest<QuestionResponse[]>({
    path: `/v1/campaign/${campaignID}/questions/common`,
  });

export const createOrGetApplication = (campaignId: string) =>
  authenticatedRequest<{ application_id: string }>({
    method: "POST",
    path: `/v1/campaign/${campaignId}/apply`,
  });

export const setApplicationRating = (
  applicationId: string,
  rating: NewRating
) =>
  authenticatedRequest({
    method: "PUT",
    path: `/v1/application/${applicationId}/rating`,
    body: rating,
    jsonResp: false,
  });

export const createApplicationRating = (
  applicationId: string,
  rating: NewRating
) =>
  authenticatedRequest({
    method: "POST",
    path: `/v1/application/${applicationId}/rating`,
    body: rating,
    jsonResp: false,
  });

export const getSelfInfo = () =>
  authenticatedRequest<User>({ path: "/v1/user" });

export const getApplicationAnswers = (applicationId: string, roleId: string) =>
  authenticatedRequest<Answer[]>({
    path: `/v1/application/${applicationId}/answers/role/${roleId}`,
  });

export const getCommonApplicationAnswers = (applicationId: string) =>
  authenticatedRequest<Answer[]>({
    path: `/v1/application/${applicationId}/answers/common`,
  });

export const getApplicationRatings = (applicationId: string) =>
  authenticatedRequest<{ ratings: ApplicationRating[] }>({
    path: `/v1/application/${applicationId}/ratings`,
  });

// Update application roles (selection and preference)
export const updateApplicationRoles = (
  applicationId: string,
  payload: ApplicationRoleUpdateInput
) =>
  authenticatedRequest({
    method: "PATCH",
    path: `/v1/application/${applicationId}/roles`,
    body: payload,
    jsonResp: false,
  });

// Get application roles
export const getApplicationRoles = (applicationId: string) =>
  authenticatedRequest<ApplicationRole[]>({
    path: `/v1/application/${applicationId}/roles`,
  });

// Create a new answer
export const createAnswer = (
  applicationId: string,
  questionId: string,
  answerType: QuestionType,
  answerData: AnswerData
) =>
  authenticatedRequest<{ id: string }>({
    method: "POST",
    path: `/v1/application/${applicationId}/answer`,
    body: {
      question_id: questionId,
      answer_type: answerType,
      answer_data: answerData,
    },
  });

// Update an existing answer
export const updateAnswer = (
  answerId: string,
  questionId: string,
  answerType: QuestionType,
  answerData: AnswerData
) =>
  authenticatedRequest({
    method: "PATCH",
    path: `/v1/answer/${answerId}`,
    body: {
      question_id: questionId,
      answer_type: answerType,
      answer_data: answerData,
    },
    jsonResp: false,
  });

// Delete an answer
export const deleteAnswer = (answerId: string) =>
  authenticatedRequest({
    method: "DELETE",
    path: `/v1/answer/${answerId}`,
    jsonResp: false,
  });

// Submit an application
export const submitApplication = (applicationId: string) =>
  authenticatedRequest({
    method: "POST",
    path: `/v1/application/${applicationId}/submit`,
    jsonResp: false,
  });

// Check if current user already has an application for this campaign
export const checkApplicationExists = (campaignId: string) =>
  authenticatedRequest<{ application_exists: boolean }>({
    path: `/v1/campaign/${campaignId}/application/exists`,
  });

// Get campaigns for an organisation
export const getOrganisationCampaigns = (organisationId: string) =>
  authenticatedRequest<
    Array<{
      id: string;
      slug: string;
      name: string;
      cover_image?: string | null;
      description?: string | null;
      starts_at: string;
      ends_at: string;
    }>
  >({
    path: `/v1/organisation/${organisationId}/campaigns`,
  });

// Legacy function - keeping for backward compatibility
export const submitAnswer = (
  applicationId: string,
  questionId: string,
  answerData: AnswerData
) =>
  authenticatedRequest({
    method: "POST",
    path: `/v1/application/${applicationId}/answer/`,
    body: {
      application_id: applicationId,
      question_id: questionId,
      answer_data: answerData,
    },
    jsonResp: false,
  });

// todo: update to new route
export const createCampaign = (
  campaign: NewCampaignInput
  // roles: RoleInput[],
  // questions: QuestionInput[]
) =>
  authenticatedRequest<{ id: string }>({
    method: "POST",
    path: `/v1/organisation/${campaign.organisation_id}/campaign`,
    body: campaign,
  });
// todo: update to new route
export const setCampaignCoverImage = (campaignId: string, cover_image: File) =>
  authenticatedRequest<string>({
    method: "PATCH",
    path: `/v1/campaign/${campaignId}/banner`,
    body: cover_image,
    jsonBody: false,
  });
// todo: update to new route
export const deleteCampaign = (id: string) =>
  authenticatedRequest({
    method: "DELETE",
    path: `/v1/campaign/${id}`,
    jsonResp: false,
  });

// todo: update to new route
export const setApplicationStatus = (
  applicationId: string,
  status: ApplicationStatus
) =>
  authenticatedRequest({
    method: "PATCH",
    path: `/v1/application/${applicationId}/status`,
    body: status,
    jsonResp: false,
  });

// todo: update to new route
export const inviteUserToOrg = (
  email: string,
  organisationId: string,
  adminLevel: OrganisationRole = "User"
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

/**
 * helper function to retrieve list of all answers in every application,
 * retrieving answer option text for question types with predefined answers such as
 * multiple choice. Returns answers mapped by question ID for proper matching.
 *
 * @param applications
 * @param campaignId
 * @param roleId
 * @returns Record<string, string | string[]>[] - array of answer maps per application
 */
export const getAnsweredApplicationQuestions = (
  applications: ApplicationDetails[],
  campaignId: string,
  roleId: string
) => {
  return Promise.all(
    applications.map(async (application) => {
      const roleAnswers = await getApplicationAnswers(application.id, roleId);
      const commonAnswers = await getCommonApplicationAnswers(application.id);

      const roleQuestions = await getRoleQuestions(campaignId, roleId);
      const commonQuestions = await getCommonQuestions(campaignId);

      const completeAnswers = [...commonAnswers, ...roleAnswers];
      const completeQuestions = [...commonQuestions, ...roleQuestions];

      // Create a map of answers by question ID
      const answerMap: Record<string, string | string[]> = {};

      completeAnswers.forEach((answer) => {
        // normalize to use answer.answer_data
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data: any = (answer as any).answer_data ?? (answer as any).data;
        const questionId = answer.question_id;

        switch (answer.answer_type) {
          case QuestionType.ShortAnswer:
            answerMap[questionId] = data as string;
            break;

          case QuestionType.MultiChoice:
            // search question list for questions of Multichoice type
            const mcQuestion = completeQuestions.find(
              (question) =>
                question.id === questionId &&
                question.question_type === QuestionType.MultiChoice
            );
            answerMap[questionId] =
              mcQuestion?.data.options.find((option) => option.id === data)
                ?.text || "";
            break;

          case QuestionType.MultiSelect:
            const msQuestion = completeQuestions.find(
              (question) =>
                question.id === questionId &&
                question.question_type === QuestionType.MultiSelect
            );
            answerMap[questionId] =
              msQuestion?.data.options
                .filter(
                  (option) => Array.isArray(data) && data.includes(option.id)
                )
                .map((option) => option.text) || [];
            break;

          case QuestionType.DropDown:
            const ddQuestion = completeQuestions.find(
              (question) =>
                question.id === questionId &&
                question.question_type === QuestionType.DropDown
            );
            answerMap[questionId] =
              ddQuestion?.data.options.find((option) => option.id === data)
                ?.text || "";
            break;

          case QuestionType.Ranking:
            const rankQuestion = completeQuestions.find(
              (question) =>
                question.id === questionId &&
                question.question_type === QuestionType.Ranking
            );
            answerMap[questionId] =
              rankQuestion?.data.options
                .filter(
                  (option) => Array.isArray(data) && data.includes(option.id)
                )
                .map((option) => option.text) || [];
            break;
        }
      });

      return answerMap;
    })
  );
};

// Organisation members
export const getOrganisationMembers = (organisationId: string) =>
  authenticatedRequest<{ members: Member[] }>({
    path: `/v1/organisation/${organisationId}/members`,
  });

export const addOrganisationMember = (
  organisationId: string,
  email: string,
  role: OrgRoleType
) =>
  authenticatedRequest({
    method: "POST",
    path: `/v1/organisation/${organisationId}/member`,
    body: { email, role },
    jsonResp: false,
  });

export const removeOrganisationMember = (
  organisationId: string,
  user_id: string
) =>
  authenticatedRequest({
    method: "DELETE",
    path: `/v1/organisation/${organisationId}/member`,
    body: { user_id },
    jsonResp: false,
  });

export const updateOrganisationMemberRole = (
  organisationId: string,
  user_id: string,
  role: OrgRoleType
) =>
  authenticatedRequest({
    method: "PUT",
    path: `/v1/organisation/${organisationId}/member`,
    body: { user_id, role },
    jsonResp: false,
  });
