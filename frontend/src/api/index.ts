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
    method: "GET",
    path: `/auth/callback/google?code=${oauthToken}`,
    credentials: 'include', // Ensure cookies are sent with the request
  });

// todo: update to new route
export const doSignup = async (
  zid: string,
  name: string,
  starting_year: number,
  degree_name: string,
  gender: UserGender,
  pronouns: string
) =>
  API.request<AuthenticateResponse>({
    method: "POST",
    path: `/user/signup`,
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

// todo: update to cookies-based approach
const authenticatedRequest = <T = void>(
  payload: Parameters<typeof API.request<T>>[0]
) => {
  return API.request<T>({
    ...payload,
    credentials: 'include', // This ensures cookies are sent with the request
  });
};

// todo: update to new route
export const getAllCampaigns = () =>
  authenticatedRequest<CampaignWithRoles[]>({
    path: "/campaign",
  });

export const getAdminData = (organisationId: number) =>
  authenticatedRequest<{ members: Member[] }>({
    path: `/organisation/${organisationId}/admin`,
  });

// todo: create backend route + update referencing components
export const getAdminOrgs = () =>
  authenticatedRequest<{ organisations: Organisation[] }>({
    path: "/organisation/admin",
  });

export const getOrganisation = (organisationId: number) =>
  authenticatedRequest<Organisation>({
    path: `/organisation/${organisationId}`,
  });

export const getOrganisationBySlug = (organisationSlug: string) =>
  authenticatedRequest<Organisation>({
    path: `/organisation/slug/${organisationSlug}`,
  });

// todo: update all referencing components
export const createOrganisation = (orgData: newOrganisation) =>
  authenticatedRequest<Organisation>({
    method: "POST",
    path: "/organisation",
    body: orgData,
  });

export const putOrgLogo = async (orgId: number, logo: File) => {
  const presignedUrl = await authenticatedRequest<string>({
    method: "PATCH",
    path: `/organisation/${orgId}/logo`,
  });

  await fetch(presignedUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': logo.type,
    },
    body: logo
  });

  return presignedUrl;
};

export const newApplication = (campaignId: number, newApp: NewApplication) =>
  authenticatedRequest<Application>({
    method: "POST",
    path: `/campaign/${campaignId}/application/`,
    body: newApp,
  });

export const doDeleteOrg = (orgId: number) =>
  authenticatedRequest({
    method: "DELETE",
    path: `/organisation/${orgId}`,
    jsonResp: false,
  });

export const getCampaign = (campaignId: number) =>
  authenticatedRequest<Campaign>({ path: `/campaign/${campaignId}` });

export const getCampaignBySlugs = (organisationSlug: string, campaignSlug: string) =>
  authenticatedRequest<Campaign>({
    path: `/campaign/slug/${organisationSlug}/${campaignSlug}`,
  });

export const getCampaignRoles = (campaignId: number) =>
  authenticatedRequest<Role[]>({
    path: `/campaign/${campaignId}/roles`,
  });

export const getRoleApplications = (roleId: number) =>
  authenticatedRequest<ApplicationDetails[]>({
    path: `/role/${roleId}/applications`,
  });

export const getRoleQuestions = (campaignId: number, roleId: number) =>
  authenticatedRequest<QuestionResponse[]>({
    path: `/campaign/${campaignId}/role/${roleId}/questions`,
  });

// todo: update all referencing components
export const getCommonQuestions = (campaignID: number) =>
  authenticatedRequest<QuestionResponse[]>({
    path: `/campaign/${campaignID}/questions/common`
  });

export const setApplicationRating = (applicationId: number, rating: NewRating) =>
  authenticatedRequest({
    method: "PUT",
    path: `/application/${applicationId}/rating`,
    body: rating,
    jsonResp: false,
  });

export const getSelfInfo = () =>
  authenticatedRequest<User>({ path: "/user" });

export const getApplicationAnswers = (applicationId: number, roleId: number) =>
  authenticatedRequest<Answer[]>({
    path: `/application/${applicationId}/answers/role/${roleId}`,
  });

export const getCommonApplicationAnswers = (applicationId: number) => 
  authenticatedRequest<Answer[]>({
    path: `/application/${applicationId}/answers/common`,
  });

export const getApplicationRatings = (applicationId: number) =>
  authenticatedRequest<{ ratings: ApplicationRating[] }>({
    path: `/application/${applicationId}/ratings`,
  });

// todo: update all referencing components
export const submitAnswer = (
  applicationId: number,
  questionId: number,
  answerData: AnswerData
) =>
  authenticatedRequest({
    method: "POST",
    path: `/application/${applicationId}/answer`,
    body: {
      question_id: questionId,
      answer_data: answerData,
    },
    jsonResp: false,
  });

export const updateAnswer = (
  answerId: number,
  answerData: AnswerData
) =>
  authenticatedRequest({
    method: "PATCH",
    path: `/answer/${answerId}`,
    body: {
      answer_data: answerData,
    },
    jsonResp: false,
  });

export const deleteAnswer = (answerId: number) =>
  authenticatedRequest({
    method: "DELETE",
    path: `/answer/${answerId}`,
    jsonResp: false,
  });

export const updateApplicationRoles = (
  applicationId: number,
  roleIds: number[]
) =>
  authenticatedRequest({
    method: "PATCH",
    path: `/application/${applicationId}/roles`,
    body: {
      role_ids: roleIds,
    },
    jsonResp: false,
  });

export const submitApplication = (applicationId: number) =>
  authenticatedRequest({
    method: "POST",
    path: `/application/${applicationId}/submit`,
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
    path: `/organisation/${campaign.organisation_id}/campaign`,
    body: { campaign, roles, questions },
  });

// todo: update to new route
export const setCampaignCoverImage = (campaignId: number, cover_image: File) =>
  authenticatedRequest<string>({
    method: "PATCH",
    path: `/campaign/${campaignId}/banner`,
    body: cover_image,
    jsonBody: false,
  });

// todo: update to new route
export const deleteCampaign = (id: number) =>
  authenticatedRequest({
    method: "DELETE",
    path: `/campaign/${id}`,
    jsonResp: false,
  });

// todo: update to new route
export const setApplicationStatus = (
  applicationId: number,
  status: ApplicationStatus
) =>
  authenticatedRequest({
    method: "PATCH",
    path: `/application/${applicationId}/status`,
    body: { status },
    jsonResp: false,
  });

// todo: update to new route
export const setApplicationPrivateStatus = (
  applicationId: number,
  status: ApplicationStatus
) =>
  authenticatedRequest({
    method: "PATCH",
    path: `/application/${applicationId}/private`,
    body: { status },
    jsonResp: false,
  });

// todo: update to new route
export const inviteUserToOrg = (
  email: string,
  organisationId: number,
  adminLevel: OrganisationRole = "User"
) =>
  authenticatedRequest({
    method: "POST",
    path: `/organisation/${organisationId}/members`,
    body: {
      email,
      role: adminLevel,
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

export const updateUserProfile = {
  name: (name: string) =>
    authenticatedRequest({
      method: "PATCH",
      path: "/user/name",
      body: { name },
      jsonResp: false,
    }),
  pronouns: (pronouns: string) =>
    authenticatedRequest({
      method: "PATCH",
      path: "/user/pronouns",
      body: { pronouns },
      jsonResp: false,
    }),
  gender: (gender: UserGender) =>
    authenticatedRequest({
      method: "PATCH",
      path: "/user/gender",
      body: { gender },
      jsonResp: false,
    }),
  zid: (zid: string) =>
    authenticatedRequest({
      method: "PATCH",
      path: "/user/zid",
      body: { zid },
      jsonResp: false,
    }),
  degree: (degree_name: string, degree_starting_year: number) =>
    authenticatedRequest({
      method: "PATCH",
      path: "/user/degree",
      body: { degree_name, degree_starting_year },
      jsonResp: false,
    }),
};

export const updateUserName = (name: string) =>
  authenticatedRequest({
    method: "PATCH",
    path: "/user/name",
    body: { name },
    jsonResp: false,
  });

export const updateUserPronouns = (pronouns: string) =>
  authenticatedRequest({
    method: "PATCH",
    path: "/user/pronouns",
    body: { pronouns },
    jsonResp: false,
  });

export const updateUserGender = (gender: UserGender) =>
  authenticatedRequest({
    method: "PATCH",
    path: "/user/gender",
    body: { gender },
    jsonResp: false,
  });

export const updateUserZid = (zid: string) =>
  authenticatedRequest({
    method: "PATCH",
    path: "/user/zid",
    body: { zid },
    jsonResp: false,
  });

export const updateUserDegree = (degree: string) =>
  authenticatedRequest({
    method: "PATCH",
    path: "/user/degree",
    body: { degree },
    jsonResp: false,
  });