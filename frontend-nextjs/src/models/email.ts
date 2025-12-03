import { apiRequest } from "@/lib";
import { AppMessage } from "./app";

export interface EmailTemplate {
    id: string;
    organisation_id: string;
    name: string;
    template_subject: string;
    template_body: string;
}

export interface NewEmailTemplate {
    name: string;
    template_subject: string;
    template_body: string;
}

// TODO: implement template categories
export interface TemplateVariable {
    key: string;
    description: string;
    example: string;
}


export interface TemplateCategory {
    value: string;
    label: string;
}

// Dummy data for preview
export const previewData = {
    name: "Sarah Chen",
    role: "Marketing Director",
    organisation_name: "DevSoc",
    campaign_name: "DevSoc Executive Recruitment 2024",
    expiry_date: "March 30, 2024",
}

// Available template variables
export const templateVariables: TemplateVariable[] = [
    { key: "{{name}}", description: "Applicant's full name", example: "Sarah Chen" },
    { key: "{{role}}", description: "Role applied for", example: "Marketing Director" },
    { key: "{{organisation_name}}", description: "Organization name", example: "DevSoc" },
    { key: "{{campaign_name}}", description: "Campaign name", example: "DevSoc Executive Recruitment 2024" },
    { key: "{{expiry_date}}", description: "Offer expiry date", example: "March 30, 2024" },
];

// Template categories
export const templateCategories: TemplateCategory[] = [
    { value: "all", label: "All Templates" },
    { value: "interview", label: "Interview" },
    { value: "acceptance", label: "Acceptance" },
    { value: "rejection", label: "Rejection" },
    { value: "confirmation", label: "Confirmation" },
    { value: "reminder", label: "Reminder" },
];

export async function getOrganisationEmailTemplates(organisationId: string): Promise<EmailTemplate[]> {
    return await apiRequest<EmailTemplate[]>(`/api/v1/organisation/${organisationId}/email_templates`);
}

export async function createEmailTemplate(organisationId: string, template: NewEmailTemplate): Promise<AppMessage> {
    return await apiRequest<AppMessage>(`/api/v1/organisation/${organisationId}/email_template`, { method: "POST", body: template });
}

export async function getEmailTemplate(templateId: string): Promise<EmailTemplate> {
    return await apiRequest<EmailTemplate>(`/api/v1/email_template/${templateId}`);
}

export async function duplicateEmailTemplate(templateId: string): Promise<AppMessage> {
    return await apiRequest<AppMessage>(`/api/v1/email_template/${templateId}/duplicate`, { method: "POST" });
}

export async function updateEmailTemplate(templateId: string, template: EmailTemplate): Promise<AppMessage> {
    return await apiRequest<AppMessage>(`/api/v1/email_template/${templateId}`, { method: "PATCH", body: template });
}

export async function deleteEmailTemplate(templateId: string): Promise<AppMessage> {
    return await apiRequest<AppMessage>(`/api/v1/email_template/${templateId}`, { method: "DELETE" });
}