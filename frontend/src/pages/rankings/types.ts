import type { ApplicationRating } from "../../types/api";

export type Ranking = {
  name: string;
  id: number;
  ratings: ApplicationRating[];
};

export type Rankings = {
  [k: string]: Ranking[];
};

export type Applications = {
  [role: string]: {
    [id: number]: {
      zId: string;
      questions: { question: string; answer?: string }[];
    };
  };
};
