/* eslint-disable camelcase */
import API from "./api";

const authenticate = async (oauth_token) =>
  API.request({
    method: "POST",
    path: `/auth/signin`,
    body: {
      oauth_token,
    },
  });

const authenticatedRequest = () => {
  const token = `Bearer ${localStorage.getItem("AUTH_TOKEN")}`;
  return {
    getUser: async () =>
      API.request({
        path: "/user",
        header: {
          "Content-Type": "application/json",
          Authorization: token,
        },
      }),
  };
};

export { authenticatedRequest, authenticate };
