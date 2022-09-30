export type ApplicationWithQuestions = {
  applicationId: number;
  zId: string;
  mark?: number;
  questions: Question[];
};

export type ApplicationsWithQuestions = {
  [role: string]: ApplicationWithQuestions[];
};

type Question = {
  question: string;
  answer?: string;
};
