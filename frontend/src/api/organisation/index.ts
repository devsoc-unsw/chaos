import { createQueryKeys } from "@lukemorales/query-key-factory";

import request from "api/axios";

type OrganisationCreateRequest = {
  name: string;
  admin: number;
};
type OrganisationCreateResponse = {
  message: string;
};

const createOrganisation = (data: OrganisationCreateRequest) =>
  request<OrganisationCreateRequest, OrganisationCreateResponse>({
    path: "/organisation",
    data,
    method: "post",
  });

const organisation = createQueryKeys("organisation", {
  create: (data: OrganisationCreateRequest) => ({
    queryKey: [data.name, data.admin],
    queryFn: () => createOrganisation(data),
  }),
});

export default organisation;
