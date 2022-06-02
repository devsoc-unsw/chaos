// takes in an object
const API = {
  request: ({ path, body, header, queries = {}, method = "GET" }) => {
    const endpoint = new URL(`${window.origin}/api${path}`);
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
