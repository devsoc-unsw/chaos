import API from "./api";

const authenticatedRequest = () => {
  const token = `Bearer ${localStorage.getItem("AUTH_TOKEN")}`;
  return {
    getUser: async () =>
      API.request({
        path: "/user",
        method: "GET",
        header: {
          "Content-Type": "application/json",
          Authorization: token,
        },
      }),
  };
};

export { authenticatedRequest };
