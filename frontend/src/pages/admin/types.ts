import type {
  AdminLevel,
  CampaignInfo,
  OrganisationUserInfo,
} from "../../types/api";

export type Organisation = {
  id: string;
  icon: string;
  orgName: string;
  campaigns: CampaignInfo[];
  members: OrganisationUserInfo[];
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
  role: AdminLevel;
};

type Question = {
  question: string;
  answer?: string;
};

export type ApplicationWithQuestions = {
  applicationId: string;
  zId: string;
  mark?: number;
  questions: Question[];
};
