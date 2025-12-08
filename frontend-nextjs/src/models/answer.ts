import { apiRequest } from "@/lib";

export interface Answer {
    id: string,
    question_id: string,
    answer_type: AnswerType,
    answer_data: AnswerData,
    created_at: string,
    updated_at: string,
}

export type AnswerType = "ShortAnswer" | "MultiChoice" | "MultiSelect" | "DropDown" | "Ranking";

export type AnswerData = string | string[];

export async function getAllCommonAnswers(applicationId: string): Promise<Answer[]> {
    return await apiRequest<Answer[]>(`/api/v1/application/${applicationId}/answers/common`);
}

export async function getAllRoleAnswers(applicationId: string, roleId: string): Promise<Answer[]> {
    return await apiRequest<Answer[]>(`/api/v1/application/${applicationId}/role/${roleId}/answers`);
}
