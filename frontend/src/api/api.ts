import type { Json } from "types/api";

export class FetchError extends Error {
  constructor(
    public response: Response,
    public data?: unknown
  ) {
    super(`HTTP error! status: ${response.status}`);
    this.name = "FetchError";
  }
}

type Payload = {
  method: string;
  headers: { [k: string]: string };
  credentials?: RequestCredentials;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body?: any;
};

type Params<T> = {
  path: string;
  header?: { [k: string]: string };
  queries?: { [k: string]: string };
  method?: string;
  credentials?: RequestCredentials;
} & ({ body?: Json; jsonBody?: true } | { body?: unknown; jsonBody: false }) &
  (T extends void ? { jsonResp: false } : { jsonResp?: true });

const API_BASE_URL = 'http://localhost:8080/api/v1';

const API = {
  request: async <T = void>({
    path,
    body,
    header,
    queries = {},
    method = "GET",
    jsonBody = true,
    jsonResp = true,
  }: Params<T>): Promise<T> => {
    const baseUrl = API_BASE_URL || '';
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    const endpoint = new URL(`${baseUrl}/${cleanPath}`, window.location.origin);
    endpoint.search = new URLSearchParams(queries).toString();

    const payload: Payload = {
      method,
      headers: {
        ...(jsonBody && { "Content-Type": "application/json" }),
        ...header,
      },
      credentials: 'include',
    };
    if (method !== "GET") payload.body = jsonBody ? JSON.stringify(body) : body;

    const resp = await fetch(endpoint, payload);
    if (!resp.ok) {
      let data;
      try {
        data = await resp.json();
      } catch (e) {
        // just let data be undefined
      }
      throw new FetchError(resp, data);
    }

    if (jsonResp) {
      return resp.json() as Promise<T>;
    }
    return undefined as T;
  },
};

export default API;
