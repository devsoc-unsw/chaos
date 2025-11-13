import { cookies } from "next/headers";

/**
 * Gets the auth token from HTTP-only cookies in server components
 * @returns The auth token string or undefined if not present
 */
export async function getAuthToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  const authToken = cookieStore.get("auth_token");
  return authToken?.value;
}

/**
 * Checks if user is authenticated by verifying auth_token cookie exists
 * @returns True if user has valid auth token cookie
 */
export async function isAuthenticated(): Promise<boolean> {
  const token = await getAuthToken();
  return !!token;
}

