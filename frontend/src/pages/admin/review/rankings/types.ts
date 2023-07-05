import type { ApplicationWithQuestions } from "pages/admin/types";
import type { ApplicationStatus } from "types/api";

export type Ranking = {
  name: string;
  id: number;
  status: ApplicationStatus;
  ratings: { rater: string; rating: number }[];
};

export type Rankings = {
  [k: string]: Ranking[];
};

export type Applications = {
  [id: number]: ApplicationWithQuestions;
};
