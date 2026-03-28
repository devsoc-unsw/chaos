import { apiRequest } from "@/lib/api";

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

export type UserDetails = {
  id: string;
  email: string;
  zid: string | null;
  name: string;
  pronouns: string | null;
  gender: string | null;
  degree_name: string | null;
  degree_starting_year: number | null;
};

export type IsSuperuserResponse = {
  is_superuser: boolean;
};

export async function getIsSuperuser(): Promise<IsSuperuserResponse> {
  return apiRequest<IsSuperuserResponse>("/api/v1/user/is_superuser");
}