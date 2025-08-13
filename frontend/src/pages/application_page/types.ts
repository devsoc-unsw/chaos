export type RoleQuestions = {
  [role: string]: RoleQuestion[];
};

export type RoleQuestion = {
  id: string;
  text: string;
}