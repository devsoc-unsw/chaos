import { createContext } from "react";

export type Message = {
  type: "error" | "warning" | "success";
  message: string;
  id: number;
};

// eslint-disable-next-line @typescript-eslint/no-empty-function
export const MessagePopupContext = createContext(
  (_message: Omit<Message, "id">) => {},
);
