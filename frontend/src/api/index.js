/* eslint-disable camelcase */
import { getStore } from "../utils";
import API from "./api";

const authenticate = async (oauth_token) =>
  API.request({
    method: "POST",
    path: `/auth/signin`,
    body: {
      oauth_token,
    },
  });

const doSignup = async ({ name, degree_name, zid, starting_year }) =>
  API.request({
    method: "POST",
    path: `/auth/signup`,
    body: {
      signup_token: getStore("signup_token"),
      zid,
      display_name: name,
      degree_starting_year: starting_year,
      degree_name,
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

export { authenticatedRequest, authenticate, doSignup };
