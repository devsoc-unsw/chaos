import type { Dispatch, SetStateAction } from "react";

export type Role = {
  id: number;
  title: string;
  quantity: number;
};

export type Question = {
  id: number;
  text: string;
  roles: Set<number>;
  required?: boolean;
};

export type Answers = {
  [id: number]: string;
};

export type Campaign = {
  tab: number;
  setTab: Dispatch<SetStateAction<number>>;
  campaignName: string;
  setCampaignName: Dispatch<SetStateAction<string>>;
  startDate: Date;
  setStartDate: Dispatch<SetStateAction<Date>>;
  endDate: Date;
  setEndDate: Dispatch<SetStateAction<Date>>;
  description: string;
  setDescription: Dispatch<SetStateAction<string>>;
  interviewStage: boolean;
  setInterviewStage: Dispatch<SetStateAction<boolean>>;
  scoringStage: boolean;
  setScoringStage: Dispatch<SetStateAction<boolean>>;
  cover: string | null;
  setCover: Dispatch<SetStateAction<string | null>>;
  error: string | null;
  setError: Dispatch<SetStateAction<string | null>>;
  roles: Role[];
  setRoles: Dispatch<SetStateAction<Role[]>>;
  roleSelected: number;
  setRoleSelected: Dispatch<SetStateAction<number>>;
  questions: Question[];
  setQuestions: Dispatch<SetStateAction<Question[]>>;
  answers: Answers;
  setAnswers: Dispatch<SetStateAction<Answers>>;
};
