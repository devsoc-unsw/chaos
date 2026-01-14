import { User } from "@/models";
import { apiRequest } from "./api";

/**
 * Gets the current authenticated user's profile
 * Works on both server and client automatically
 */
export async function getCurrentUser(): Promise<User> {
  return await apiRequest<User>("/api/v1/user");
}
