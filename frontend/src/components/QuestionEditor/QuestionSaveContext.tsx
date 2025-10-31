import { createContext, useContext } from "react";
import type { Block } from "@blocknote/core";

type QuestionSaveContextType = {
  onSaveQuestion: (block: Block) => Promise<void>;
  onDeleteQuestion: (block: Block) => Promise<void>;
  isSaving: boolean;
  savingBlockId: string | null;
};

export const QuestionSaveContext = createContext<QuestionSaveContextType | null>(null);

export const useQuestionSave = () => {
  const context = useContext(QuestionSaveContext);
  if (!context) {
    throw new Error("useQuestionSave must be used within QuestionSaveProvider");
  }
  return context;
};

