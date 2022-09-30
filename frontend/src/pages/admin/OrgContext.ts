import { createContext } from "react";
import { Organisation } from "./types";

export const OrgContext = createContext({
  orgSelected: -1,
  setOrgSelected: (_orgSelected: number) => {},
  orgList: [] as Organisation[],
  setOrgList: (_orgList: Organisation[]) => {},
});
