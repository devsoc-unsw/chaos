import { apiRequest } from "@/lib";
import { Answer } from "./answer";
import { AnswerData } from "./answer";
export interface Question {
    id: string,
    title: string,
    description: string | null,
    common: boolean,
    roles: string[],
    required: boolean,
    question_type: QuestionType,
    data: QuestionData,
    created_at: string,
    updated_at: string,
}


export type QuestionType = "ShortAnswer" | "MultiChoice" | "MultiSelect" | "DropDown" | "Ranking"
export type AnswerValue = string | string[] | MultiOptionQuestionOption | number
export type QuestionData = MultiOptionData;

export interface MultiOptionData {
    options: MultiOptionQuestionOption[],
}

export interface MultiOptionQuestionOption {
    id: string,
    display_order: number,
    text: string,
}

export interface QuestionAndAnswer {
    question_id: string
    answer_id: string | undefined,
    text: string,
    answer: AnswerValue,
    question_type: QuestionType,
    required: boolean,
    options: MultiOptionQuestionOption[],
    description: string | null,
}

export async function getAllCommonQuestions(campaignId: string): Promise<Question[]> {
    return await apiRequest<Question[]>(`/api/v1/campaign/${campaignId}/questions/common`);
}

export async function getAllRoleQuestions(campaignId: string, roleId: string): Promise<Question[]> {
    return await apiRequest<Question[]>(`/api/v1/campaign/${campaignId}/role/${roleId}/questions`);
}

export async function createQuestion(campaignId: string, question: Question): Promise<{ id: string }> {
    return await apiRequest<{ id: string }>(`/api/v1/campaign/${campaignId}/question`, {
        method: "POST",
        body: question,
    });
}

export async function updateQuestion(campaignId: string, questionId: string, question: Question): Promise<void> {
    await apiRequest(`/api/v1/campaign/${campaignId}/question/${questionId}`, {
        method: "PATCH",
        body: question,
    });
}

export async function deleteQuestion(campaignId: string, questionId: string): Promise<void> {
    await apiRequest(`/api/v1/campaign/${campaignId}/question/${questionId}`, {
        method: "DELETE",
    });
}

export function processAnswerForDisplay(
    questionType: QuestionType,
    answerData: AnswerData | null | undefined,
    options?: MultiOptionQuestionOption[]
): AnswerValue {
    if (!answerData || answerData === null) {
        return "No Answer";
    }

    switch (questionType) {
        case "ShortAnswer":
            return answerData ?? "No Answer";

        case "MultiChoice":
        case "DropDown": {
            const answerStr = String(answerData);
            if (answerStr === "0" || answerStr === "" || !answerStr) {
                return "No Answer";
            }
            const selectedOption = options?.find((option) => option.id === answerStr);
            return selectedOption?.text ?? "No Answer";
        }

        case "MultiSelect": {
            const answerArray = Array.isArray(answerData) ? answerData : [];
            const selectedOptions = options?.filter((option) => answerArray.includes(option.id)) ?? [];
            return selectedOptions.length > 0
                ? selectedOptions.map((option) => option.text).join(", ")
                : "No Answer";
        }

        case "Ranking": {
            const answerArray = Array.isArray(answerData) ? answerData : [];
            if (answerArray.length === 0 || !options) {
                return "No Answer";
            }
            return answerArray
                .map((id, index) => {
                    const option = options.find((opt) => opt.id === id);
                    return option ? `${index + 1}. ${option.text}` : null;
                })
                .filter(Boolean)
                .join(", ");
        }

        default:
            return "No Answer";
    }
}

export function linkQuestionsAndAnswers(questions: Question[], answers: Answer[]): QuestionAndAnswer[] {
    return questions.map((question) => {
        const answer = answers?.find((answer) => answer.question_id === question.id);
        const processedAnswer = processAnswerForDisplay(
            question.question_type,
            answer?.answer_data,
            question.data?.options
        );

        return {
            question_id: question.id,
            answer_id: answer?.id,
            text: question.title,
            answer: processedAnswer,
            question_type: question.question_type,
            required: question.required,
            options: question.data?.options,
            description: question?.description,
        };
    });
}