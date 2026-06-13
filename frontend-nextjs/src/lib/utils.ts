import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import moment from "moment";
import { QuestionAndAnswer } from "@/models/question";
import { ApplicationStatus } from "@/models/application";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function dateToString(date: string) {
    return moment(date).format("D MMM YYYY H:mm");
}

// I might wanna move this out of here lowk it's kinda question specific
export function buildAnswerPayload(question: QuestionAndAnswer, value: unknown) {
  console.log(question)
  if (!question?.question_id) {
    throw new Error("Question object missing question_id");
  }
  if (!question?.question_type) {
    throw new Error("Question object missing question_type");
  }

  let answerData;

  switch (question.question_type) {
    case "ShortAnswer":
      answerData = String(value);
      if (answerData.trim() === '') {
        answerData = null
      }
      break;

    case "MultiChoice":
    case "DropDown":
      answerData = value;
      if (answerData === 'NO_ANSWER') {
        answerData = null
      }
      break;

    case "MultiSelect":
    case "Ranking":
      answerData = Array.isArray(value) ? value : [];
      break;

    default:
      throw new Error("Unknown question type: " + question.question_type);
  }

  return {
    question_id: String(question.question_id),
    answer_type: question.question_type,
    answer_data: answerData,
  };
}


export function privateStatusLabel(status: ApplicationStatus): string {
  switch (status) {
    case "Successful":
      return "Offer";
    case "Rejected":
      return "Reject";
    case "Pending":
      return "Pending";
    case "Interview":
      return "Interview";
  }
}

export function getWordCount (text: string) {
  if (!text) return 0;
  return text.trim().split(/\s+/).length;
};
