export type RoleQuestions = {
  [role: number]: RoleQuestion[];
};

export type RoleQuestion = {
  id: number;
  text: string;
}