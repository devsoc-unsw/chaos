import { apiRequest } from "@/lib";
import { AppMessage } from "./app";

export interface CellData {
    value: string;
    colSpan?: number;
    isMerged?: boolean;
}

export interface TemplateData {
    name: string;
    headerRow: CellData[];
    contentRow: CellData[];
}

export interface QuestionTemplate {
    template_id: number,
    campaign_id: number,
    template_name: String,
    header_row: CellData[],
    content_row: CellData[],
}

export async function getCampaignQuestionTemplates(campaignId: string): Promise<QuestionTemplate[] | null> {
    return await apiRequest<QuestionTemplate[] | null>(`/api/v1/campaign/${campaignId}/interview-questions`);
}

export async function uploadCampaignQuestionTemplate(campaignId: string, template: TemplateData): Promise<AppMessage> {
    return await apiRequest<AppMessage>(`/api/v1/campaign/${campaignId}/interview-questions`, {
        method: 'POST',
        body: template,
    });
}

export async function updateCampaignQuestionTemplate(campaignId: string, templateId: string, template: TemplateData): Promise<AppMessage> {
    return await apiRequest<AppMessage>(`/api/v1/campaign/${campaignId}/interview-questions/${templateId}`, {
        method: 'PUT',
        body: template,
    })
}

export async function deleteCampaignQuestionTemplate(campaignId: string, templateId: string): Promise<void> {
    return await apiRequest<void>(`/api/v1/campaign/${campaignId}/interview-questions/${templateId}`, {
        method: 'DELETE',
    })
}
