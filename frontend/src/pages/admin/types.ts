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
