import { apiRequest } from "@/lib";
import { Answer } from "./answer";

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
    answer_id: string,
    text: string,
    answer: string | MultiOptionQuestionOption
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

export function linkQuestionsAndAnswers(questions: Question[], answers: Answer[]): QuestionAndAnswer[] {
    return questions.map((question) => {
        const answer = answers?.find((answer) => answer.question_id === question.id);
        
        if (question.question_type === "ShortAnswer") {
            return {
                question_id: question.id,
                answer_id: answer?.id,
                text: question.title,
                answer: answer?.answer_data ?? "[No Answer Provided]",
                question_type: question.question_type,
                required: question.required,
                options: question.data?.options,
                description: question?.description
            };
        } else if (question.question_type === "MultiChoice" || question.question_type === "DropDown") {
            const answerData = answer?.answer_data;
            const selectedOption = question.data?.options?.find((option) => option.id === answerData);
            
            return {
                question_id: question.id,
                answer_id: answer?.id,
                text: question.title,
                answer: selectedOption?.text ?? "[No Answer Provided]",
                question_type: question.question_type,
                required: question.required,
                options: question.data?.options,
                description: question?.description
            };
        } else if (question.question_type === "MultiSelect") {
            const answerData = answer?.answer_data ?? [] as string[];
            const selectedOptions = question.data?.options?.filter((option) => answerData.includes(option.id));
            
            let answerText = "[No Answer Provided]";
            if (selectedOptions.length > 0) {
                answerText = selectedOptions.map((option) => option.text).join(", ");
            }
            
            return {
                question_id: question.id,
                answer_id: answer?.id,
                text: question.title,
                answer: answerText,
                question_type: question.question_type,
                required: question.required,
                options: question.data?.options,
                description: question?.description
            };
        } else if (question.question_type === "Ranking") {
            console.log(answer)
            const answerData = (answer?.answer_data ?? []) as string[];

            let answerText = "[No Answer Provided]";

            if (answerData.length > 0 && question.data?.options) {
                answerText = answerData
                    .map((id, index) => {
                        const option = question.data!.options!.find(
                            opt => opt.id === id
                        );
                        return option ? `${index + 1}. ${option.text}` : null;
                    })
                    .filter(Boolean)
                    .join(", ");
            }

            return {
                question_id: question.id,
                answer_id: answer?.id,
                text: question.title,
                answer: answerText,
                question_type: question.question_type,
                required: question.required,
                options: question.data?.options,
                description: question?.description
            }
        }
    });
}