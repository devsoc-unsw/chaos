/* eslint-disable @typescript-eslint/no-empty-function */
import { createContext } from "react";

import type { Organisation } from "./types";

export const OrgContext = createContext({
  orgSelected: -1,
  setOrgSelected: (_orgSelected: number) => {},
  orgList: [] as Organisation[],
  setOrgList: (_orgList: Organisation[]) => {},
});
