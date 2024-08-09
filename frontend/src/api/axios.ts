import assert from "assert";

import Axios from "axios";

assert(
  typeof import.meta.env.VITE_API_BASE_URL === "string",
  "VITE_API_BASE_URL is required"
);

// global axios instance
const axios = Axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

type Params<ReqType> = {
  path: string; // relative path to the base url
  data: ReqType; // request body
  method: "get" | "post" | "put" | "delete" | "patch";
};

const request = async <ReqType, ResType>({
  path,
  data,
  method,
}: Params<ReqType>): Promise<ResType> => {
  const { data: res } = await axios<ResType>(path, { data, method });

  return res;
};

export default request;
