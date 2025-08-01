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
    path: `/v1/organisation/${organisationId}/admin`,
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
    path: `/v1/organisation/${orgId}/logo`
  });

  return fetch(presignedUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': logo.type,
    },
    body: logo
  });
}

export const newApplication = (campaignId: number, newApp: NewApplication) =>
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

export const getCampaign = (campaignId: number) =>
  authenticatedRequest<Campaign>({ path: `/v1/campaign/${campaignId}` });

export const getCampaignBySlugs = (organisationSlug: string, campaignSlug: string) =>
  authenticatedRequest<Campaign>({
    path: `/v1/campaign/slug/${organisationSlug}/${campaignSlug}`,
  });

export const getCampaignRoles = (campaignId: number) =>
  authenticatedRequest<Role[]>({
    path: `/v1/campaign/${campaignId}/roles`,
  });

export const getRoleApplications = (roleId: number) =>
  authenticatedRequest<ApplicationDetails[]>({
    path: `/v1/role/${roleId}/applications`,
  });

export const getRoleQuestions = (campaignId: number, roleId: number) =>
  authenticatedRequest<QuestionResponse[]>({
    path: `/v1/campaign/${campaignId}/role/${roleId}/questions`,
  });

// todo: update all referencing components
export const getCommonQuestions = (campaignID: number) =>
  authenticatedRequest<QuestionResponse[]>({
    path: `/v1/campaign/${campaignID}/questions/common`
  });

export const setApplicationRating = (applicationId: number, rating: NewRating) =>
  authenticatedRequest({
    method: "PUT",
    path: `/v1/${applicationId}/rating`,
    body: {
      rating,
    },
    jsonResp: false,
  });

export const getSelfInfo = () =>
  authenticatedRequest<User>({ path: "/v1/user" });

export const getApplicationAnswers = (applicationId: number, roleId: number) =>
  authenticatedRequest<Answer[]>({
    path: `/v1/application/${applicationId}/answers/role/${roleId}`,
  });

export const getCommonApplicationAnswers = (applicationId: number) => 
  authenticatedRequest<Answer[]>({
    path: `/v1/application/${applicationId}/answers/common`,
  });

export const getApplicationRatings = (applicationId: number) =>
  authenticatedRequest<{ ratings: ApplicationRating[] }>({
    path: `/v1/${applicationId}/ratings`,
  });

// todo: update all referencing components
export const submitAnswer = (
  applicationId: number,
  questionId: number,
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
  campaign: NewCampaignInput,
  roles: RoleInput[],
  questions: QuestionInput[]
) =>
  authenticatedRequest<Campaign>({
    method: "POST",
    path: `/v1/organisation/${campaign.organisation_id}/campaign`,
    body: { campaign, roles, questions },
  });

// todo: update to new route
export const setCampaignCoverImage = (campaignId: number, cover_image: File) =>
  authenticatedRequest<string>({
    method: "PATCH",
    path: `/v1/campaign/${campaignId}/banner`,
    body: cover_image,
    jsonBody: false,
  });

// todo: update to new route
export const deleteCampaign = (id: number) =>
  authenticatedRequest({
    method: "DELETE",
    path: `/v1/campaign/${id}`,
    jsonResp: false,
  });

// todo: update to new route
export const setApplicationStatus = (
  applicationId: number,
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
 * multiple choice.
 * 
 * first layer of [] -> list of applications
 * second layer pf [] -> list of questions/answers
 * third (optional) layer of [] -> list of selected answers for multiselect questions
 * 
 * @param applications 
 * @param campaignId 
 * @param roleId 
 * @returns string[][][] or string[][]
 */
export const getAnsweredApplicationQuestions = (applications: ApplicationDetails[], campaignId: number, roleId: number) => {
  return Promise.all(
    applications.map(async (application) => {
      const roleAnswers = await getApplicationAnswers(application.id, roleId);
      const commonAnswers = await getCommonApplicationAnswers(application.id);

      const roleQuestions = await getRoleQuestions(campaignId, roleId);
      const commonQuestions = await getCommonQuestions(campaignId);
      
      const completeAnswers = [...commonAnswers, ...roleAnswers];
      const completeQuestions = [...commonQuestions, ...roleQuestions];

      return completeAnswers.map((answer) => {
        switch (answer.answer_type) {
          case QuestionType.ShortAnswer:
            return answer.data as string;
          
          case QuestionType.MultiChoice:
            // search question list for questions of Multichoice type
            return completeQuestions.find(question => 
              question.questionType === QuestionType.MultiChoice &&
              // then search that question's multichoice options for the option which was selected
              question.data.some(data => data.options.id === answer.data
              ))?.data.find(data => data.options.id === answer.data)?.options.text; // return the text of the actual question option
            
          case QuestionType.MultiSelect:
            return completeQuestions.find(question => 
                question.questionType === QuestionType.MultiSelect &&
                question.data.some(data => Array.isArray(answer.data) && answer.data.includes(data.options.id)
              ))?.data.filter(data => Array.isArray(answer.data) && answer.data.includes(data.options.id))
              .map(data => data.options.text); // return list of text of selected options
            
          case QuestionType.DropDown:
            return completeQuestions.find(question => 
                question.questionType === QuestionType.DropDown &&
                question.data.some(data => data.options.id === answer.data
                ))?.data.find(data => data.options.id === answer.data)
                ?.options.text;
          
          case QuestionType.Ranking:
            return completeQuestions.find(question => 
                question.questionType === QuestionType.Ranking &&
                question.data.some(data => Array.isArray(answer.data) && answer.data.includes(data.options.id)
              ))?.data.filter(data => Array.isArray(answer.data) && answer.data.includes(data.options.id))
              .map(data => data.options.text);
        }
      });
    })
  );
}