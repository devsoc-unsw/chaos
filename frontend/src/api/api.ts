import type { Json } from "types/api";

export class FetchError extends Error {
  public status: number;

  public statusText: string;

  constructor(
    public resp: Response,
    public data?: unknown
  ) {
    super(resp.statusText);

    this.name = "FetchError";
    this.status = resp.status;
    this.statusText = resp.statusText;
  }
}

type Payload = {
  method: string;
  headers: { [k: string]: string };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body?: any;
};

type Params<T> = {
  path: string;
  header?: { [k: string]: string };
  queries?: { [k: string]: string };
  method?: string;
} & ({ body?: Json; jsonBody?: true } | { body?: unknown; jsonBody: false }) &
  (T extends void ? { jsonResp: false } : { jsonResp?: true });

// takes in an object
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
    // Ensure path doesn't start with a slash to avoid double slashes
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    // Use direct backend URL instead of proxy
    const endpoint = new URL(`http://localhost:8080/api/${cleanPath}`);
    endpoint.search = new URLSearchParams(queries).toString();

    const payload: Payload = {
      method,
      headers: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        ...(jsonBody && { "Content-Type": "application/json" }),
        ...header,
      },
    };
    if (method !== "GET") payload.body = jsonBody ? JSON.stringify(body) : body;

    const resp = await fetch(endpoint, {
      ...payload,
      credentials: 'include', // Include cookies
    });
    
    if (!resp.ok) {
      let data;
      try {
        // Use the same regex approach for error responses
        const text = await resp.text();
        const processedText = text.replace(/"organisation_id":(\d{16,})/g, '"organisation_id":"$1"')
                                 .replace(/"id":(\d{16,})/g, '"id":"$1"')
                                 .replace(/"campaign_id":(\d{16,})/g, '"campaign_id":"$1"')
                                 .replace(/"user_id":(\d{16,})/g, '"user_id":"$1"')
                                 .replace(/"role_id":(\d{16,})/g, '"role_id":"$1"')
                                 .replace(/"application_id":(\d{16,})/g, '"application_id":"$1"')
                                 .replace(/"question_id":(\d{16,})/g, '"question_id":"$1"')
                                 .replace(/"rater_id":(\d{16,})/g, '"rater_id":"$1"')
                                 .replace(/"commenter_user_id":(\d{16,})/g, '"commenter_user_id":"$1"');
        data = JSON.parse(processedText);
      } catch (e) {
        // just let data be undefined
      }
      throw new FetchError(resp, data);
    }

    if (jsonResp) {
      // Parse JSON manually to preserve large integers
      const text = await resp.text();
      
      // Use regex to replace large integers with strings before parsing
      const processedText = text.replace(/"organisation_id":(\d{16,})/g, '"organisation_id":"$1"')
                               .replace(/"id":(\d{16,})/g, '"id":"$1"')
                               .replace(/"campaign_id":(\d{16,})/g, '"campaign_id":"$1"')
                               .replace(/"user_id":(\d{16,})/g, '"user_id":"$1"')
                               .replace(/"role_id":(\d{16,})/g, '"role_id":"$1"')
                               .replace(/"application_id":(\d{16,})/g, '"application_id":"$1"')
                               .replace(/"question_id":(\d{16,})/g, '"question_id":"$1"')
                               .replace(/"rater_id":(\d{16,})/g, '"rater_id":"$1"')
                               .replace(/"commenter_user_id":(\d{16,})/g, '"commenter_user_id":"$1"');
      
      return JSON.parse(processedText) as T;
    }
    return undefined as T;
  },
};

export default API;
