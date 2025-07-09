// src/components/QuestionComponents/index.ts

// Define and export the QuestionType
export type QuestionType = 'short_answer' | 'dropdown' | 'multi_choice' | 'multi_select' | 'ranking';

// Export common interfaces
export interface BaseQuestionProps {
  id: number;
  question: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
}

// Export all components
export { default as ShortAnswer } from './ShortAnswer';
export { default as Dropdown } from './Dropdown';
export { default as MultiChoice } from './MultiChoice';
export { default as MultiSelect } from './MultiSelect';
export { default as Ranking } from './Ranking';