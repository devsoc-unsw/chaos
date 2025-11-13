import { getAuthToken } from "./auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

export class ApiError extends Error {
  status: number;
  statusText: string;

  constructor(status: number, statusText: string, message?: string) {
    super(message || statusText);
    this.status = status;
    this.statusText = statusText;
    this.name = "ApiError";
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  authToken?: string; // Optional token override
};

/**
 * Server-side API client that forwards auth_token cookie to backend
 * Use this in server components and server actions
 */
export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = "GET", body, headers = {}, authToken } = options;

  // Get auth token from cookies if not provided
  const token = authToken || (await getAuthToken());

  // Build request headers
  const requestHeaders: Record<string, string> = {
    ...headers,
  };

  // Add cookie header with auth_token if available
  if (token) {
    requestHeaders.Cookie = `auth_token=${token}`;
  }

  // Add content-type for JSON requests
  if (body) {
    requestHeaders["Content-Type"] = "application/json";
  }

  // Clean path and build URL
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  const url = `${API_BASE_URL}/${cleanPath}`;

  // Make request
  const response = await fetch(url, {
    method,
    headers: requestHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });

  // Handle errors
  if (!response.ok) {
    throw new ApiError(
      response.status,
      response.statusText,
      `API request failed: ${method} ${path}`
    );
  }

  // Parse response
  if (response.status === 204 || response.headers.get("content-length") === "0") {
    return undefined as T;
  }

  return (await response.json()) as T;
}

