import { createContext } from "react";

export type Message = {
  type: "error" | "warning" | "success";
  message: string;
};

// eslint-disable-next-line @typescript-eslint/no-empty-function
export const MessagePopupContext = createContext((_message: Message) => {});
