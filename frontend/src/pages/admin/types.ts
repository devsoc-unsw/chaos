import type {
  AdminLevel,
  CampaignInfo,
  OrganisationUserInfo,
} from "../../types/api";

export type Organisation = {
  id: number;
  icon: string;
  orgName: string;
  campaigns: CampaignInfo[];
  members: OrganisationUserInfo[];
};

export type Campaign = {
  id: number;
  image: string;
  title: string;
  startDate: string;
  endDate: string;
};

export type Member = {
  id: number;
  name: string;
  role: AdminLevel;
};

type Question = {
  question: string;
  answer?: string;
};

export type ApplicationWithQuestions = {
  applicationId: number;
  zId: string;
  mark?: number;
  questions: Question[];
};
