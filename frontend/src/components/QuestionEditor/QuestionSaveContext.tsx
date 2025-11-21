import React, { createContext, useContext } from "react";
import type { Block } from "@blocknote/core";

// Used to save the different states for the QuestionEditor
export type QuestionSaveContextValue = {
  onSaveQuestion?: (block: Block) => Promise<void>;
  onDeleteQuestion?: (block: Block) => Promise<void>;
  isSaving: boolean;
  savingBlockId: string | null;
};

// Used to load different states for different roles/General for the QuestionEditor 
export const QuestionSaveContext = createContext<QuestionSaveContextValue>({
  onSaveQuestion: async () => {},
  onDeleteQuestion: async () => {},
  isSaving: false,
  savingBlockId: null,
});

export const useQuestionSave = (): QuestionSaveContextValue => {
  return useContext(QuestionSaveContext);
};




