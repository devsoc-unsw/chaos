const isServer = typeof window === "undefined";
const API_BASE_URL = isServer
  ? process.env.NEXT_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "http://backend:8080"
  : process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

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
  okRequiredOtherwiseLogin?: boolean; // if the response.status is not 200, redirect to login
};

/**
 * Universal API client that works on both server and client
 * - Server: Reads cookies via next/headers and forwards them
 * - Client: Uses credentials: 'include' to send cookies
 */
export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = "GET", body, headers = {}, okRequiredOtherwiseLogin = true } = options;

  const requestHeaders: Record<string, string> = { ...headers };

  if (body) {
    requestHeaders["Content-Type"] = "application/json";
  }

  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  const url = `${API_BASE_URL}/${cleanPath}`;
  
  let fetchOptions: RequestInit;

  if (isServer) {
    // Server-side: forward cookies manually
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const authToken = cookieStore.get("auth_token");

    if (authToken?.value) {
      requestHeaders.Cookie = `auth_token=${authToken.value}`;
    }

    fetchOptions = {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
    };
  } else {
    // Client-side: use credentials include
    fetchOptions = {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
      credentials: "include",
    };
  }

  const response = await fetch(url, fetchOptions);

  if (!response.ok) {
    if (response.status === 401 && okRequiredOtherwiseLogin) {
      if (isServer) {
        const { redirect } = await import("next/navigation");
        const { headers } = await import("next/headers");
        const headersList = await headers();
        const pathname = headersList.get("x-pathname") || "/";

        redirect(`/login?to=${encodeURIComponent(pathname)}`);
      } else {
        window.location.href = `/login?to=${encodeURIComponent(window.location.pathname)}`;
      }
    }
    
    throw new ApiError(
      response.status,
      response.statusText,
      `API request failed: ${method} ${path}`
    );
  }

  if (response.status === 204 || response.headers.get("content-length") === "0") {
    return undefined as T;
  }

  return (await response.json()) as T;
}
