const API_URL = process.env.REACT_APP_API_BASE_URL;

// takes in an object
const API = {
  request: async ({ path, body, header, queries = {}, method = "GET" }) => {
    const endpoint = new URL(`${API_URL}${path}`);
    endpoint.search = new URLSearchParams(queries);

    const payload = {
      method,
      headers: {
        "Content-Type": "application/json",
        ...header,
      },
    };
    if (method !== "GET") payload.body = JSON.stringify(body);

    return fetch(endpoint, payload);
  },
};

export default API;
