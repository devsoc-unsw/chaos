export class FetchError extends Error {
  public status: number;

  public statusText: string;

  public resp: Response;

  constructor(resp: Response) {
    super(resp.statusText);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, FetchError);
    }

    this.name = "FetchError";
    this.status = resp.status;
    this.statusText = resp.statusText;
    this.resp = resp;
  }
}

type Payload = {
  method: string;
  headers: { [k: string]: string };
  body?: string;
};

type Params = {
  path: string;
  body?: any;
  header?: { [k: string]: string };
  queries?: { [k: string]: string };
  method?: string;
};

const request = async ({
  path,
  body,
  header,
  queries = {},
  method = "GET",
}: Params): Promise<Response> => {
  const endpoint = new URL(`${window.origin}/api${path}`);
  endpoint.search = new URLSearchParams(queries).toString();

  const payload: Payload = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...header,
    },
  };
  if (method !== "GET") payload.body = JSON.stringify(body);

  const resp = await fetch(endpoint, payload);
  if (!resp.ok) {
    throw new FetchError(resp);
  }
  return resp;
};

// takes in an object
const API = {
  request: async <T>(params: Params): Promise<T> => {
    const resp = await request(params);
    return await resp.json();
  },

  requestEmptyResp: request,
};

export default API;
