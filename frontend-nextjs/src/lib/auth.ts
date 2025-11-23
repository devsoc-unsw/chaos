import { User } from "@/models";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { serverApiRequest } from "./api";

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
 * Redirects to the login page
 */
function redirectToLogin() {
  redirect(process.env.NEXT_OAUTH_CALLBACK_URL || "/login");
}

/**
 * Gets the current authenticated user's profile
 * Similar to cookies(), this is a server-side helper
 * @returns The user profile or undefined if not authenticated
 */
export async function getCurrentUser(): Promise<User | undefined> {
  const token = await getAuthToken();
  if (!token) redirectToLogin();

  try {
    const user = await serverApiRequest<User>("/api/v1/user", {
      authToken: token,
    });

    return user;
  } catch (error) {
    redirectToLogin();
  }
}

