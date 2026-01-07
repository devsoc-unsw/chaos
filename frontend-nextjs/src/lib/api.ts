const API_BASE_URL = process.env.NEXT_API_BASE_URL || "http://localhost:8080";

const isServer = typeof window === "undefined";

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
  const { method = "GET", body, headers = {}, okRequiredOtherwiseLogin = false } = options;

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
    // Best-effort parse of backend error payloads like `{ "error": "..." }`
    // Use `response.clone()` so we don't consume the original body if needed elsewhere.
    let serverMessage: string | undefined;
    try {
      const cloned = response.clone();
      const contentType = cloned.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const parsed = (await cloned.json()) as unknown;
        if (
          parsed &&
          typeof parsed === "object" &&
          "error" in parsed &&
          typeof (parsed as { error?: unknown }).error === "string"
        ) {
          serverMessage = (parsed as { error: string }).error;
        } else if (
          parsed &&
          typeof parsed === "object" &&
          "message" in parsed &&
          typeof (parsed as { message?: unknown }).message === "string"
        ) {
          serverMessage = (parsed as { message: string }).message;
        }
      } else {
        const text = await cloned.text();
        // Some servers mislabel JSON error responses; try JSON parse anyway.
        try {
          const parsed = JSON.parse(text) as unknown;
          if (
            parsed &&
            typeof parsed === "object" &&
            "error" in parsed &&
            typeof (parsed as { error?: unknown }).error === "string"
          ) {
            serverMessage = (parsed as { error: string }).error;
          } else if (
            parsed &&
            typeof parsed === "object" &&
            "message" in parsed &&
            typeof (parsed as { message?: unknown }).message === "string"
          ) {
            serverMessage = (parsed as { message: string }).message;
          } else {
            serverMessage = text;
          }
        } catch {
          serverMessage = text;
        }
      }
    } catch {
      // ignore parse errors
    }
    
    throw new ApiError(
      response.status,
      response.statusText,
      serverMessage || `API request failed: ${method} ${path}`
    );
  }

  if (response.status === 204 || response.headers.get("content-length") === "0") {
    return undefined as T;
  }

  return (await response.json()) as T;
}
