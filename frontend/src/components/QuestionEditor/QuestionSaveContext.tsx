import React, { createContext, useContext } from "react";
import type { Block } from "@blocknote/core";

export type QuestionSaveContextValue = {
  onSaveQuestion?: (block: Block) => Promise<void>;
  onDeleteQuestion?: (block: Block) => Promise<void>;
  isSaving: boolean;
  savingBlockId: string | null;
};

export const QuestionSaveContext = createContext<QuestionSaveContextValue>({
  onSaveQuestion: async () => {},
  onDeleteQuestion: async () => {},
  isSaving: false,
  savingBlockId: null,
});

export const useQuestionSave = (): QuestionSaveContextValue => {
  return useContext(QuestionSaveContext);
};




