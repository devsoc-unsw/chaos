import type { Json } from "types/api";

export class FetchError extends Error {
  public status: number;

  public statusText: string;

  constructor(public resp: Response, public data?: unknown) {
    super(resp.statusText);

    this.name = "FetchError";
    this.status = resp.status;
    this.statusText = resp.statusText;
  }
}

type Payload = {
  method: string;
  headers: { [k: string]: string };
  body?: string;
};

type Params<T> = {
  path: string;
  body?: Json;
  header?: { [k: string]: string };
  queries?: { [k: string]: string };
  method?: string;
} & (T extends void ? { jsonResp: false } : { jsonResp?: true });

// takes in an object
const API = {
  request: async <T = void>({
    path,
    body,
    header,
    queries = {},
    method = "GET",
    jsonResp = true,
  }: Params<T>): Promise<T> => {
    const endpoint = new URL(`${window.origin}/api${path}`);
    endpoint.search = new URLSearchParams(queries).toString();

    const payload: Payload = {
      method,
      headers: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        "Content-Type": "application/json",
        ...header,
      },
    };
    if (method !== "GET") payload.body = JSON.stringify(body);

    const resp = await fetch(endpoint, payload);
    if (!resp.ok) {
      let data;
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
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
