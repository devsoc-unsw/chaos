import type { ApplicationWithQuestions } from "pages/admin/types";

export type Ranking = {
  name: string;
  id: number;
  ratings: { rater: string; rating: number }[];
};

export type Rankings = {
  [k: string]: Ranking[];
};

export type Applications = {
  [role: string]: {
    [id: number]: ApplicationWithQuestions;
  };
};
