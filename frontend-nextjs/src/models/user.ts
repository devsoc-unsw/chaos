export type UserRole = "User" | "SuperUser";

export type User = {
  id: string;
  email: string;
  zid: string | null;
  name: string;
  pronouns: string | null;
  gender: string | null;
  degree_name: string | null;
  degree_starting_year: number | null;
  role: UserRole;
};