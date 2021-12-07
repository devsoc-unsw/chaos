import API from "./api";

const authenticate = async (OauthCode) => {
  API.request({
    path: `/auth/${OauthCode}`,
  });
};

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
