import type {
  ApplicationAppliedRoleDetails,
  ApplicationStatus,
  CampaignInfo,
  OrganisationInfo,
  User,
} from "../../types/api";

export type Organisation = {
  id: string;
  icon: string;
  orgName: string;
  campaigns: CampaignInfo[];
  members: OrganisationInfo[];
};

export type Campaign = {
  id: string;
  image: string;
  title: string;
  startDate: string;
  endDate: string;
};

export type Member = {
  id: string;
  name: string;
  role: string;
};

type Question = {
  question: string;
  answer?: string;
  isCommon?: boolean; // Whether this is a common question or role-specific
};

// Processed type that combines ApplicationDetails from API with UI state for marking
// NOT directly returned by the API - created by transforming ApplicationDetails
export type ApplicationWithQuestions = {
  applicationId: string;
  campaign_id: string;
  user: User;
  status: ApplicationStatus;
  private_status: ApplicationStatus;
  applied_roles: ApplicationAppliedRoleDetails[];
  zId: string; // Convenience field extracted from user.zid
  mark?: number; // UI state for marking
  comment?: string; // UI state for comments
  questions: Question[]; // UI state with question-answer pairs
};
