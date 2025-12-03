import { apiRequest } from "@/lib";
import { AppMessage } from "./app";

export interface EmailTemplate {
    id: string;
    organisation_id: string;
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

// Mock email templates
export const mockTemplates = [
    {
        id: 1,
        name: "Interview Invitation",
        subject: "Interview Invitation - {{role}} at {{organisation_name}}",
        body: `Dear {{name}},
   
   
   Congratulations! We were impressed with your application for the {{role}} position in our {{campaign_name}}.
   
   
   We would like to invite you for an interview to discuss your application further. Please reply to this email with your availability for the following time slots:
   
   
   - Monday, March 25th: 10:00 AM - 5:00 PM
   - Tuesday, March 26th: 10:00 AM - 5:00 PM
   - Wednesday, March 27th: 10:00 AM - 5:00 PM
   
   
   The interview will be conducted in-person at the CSE Building, UNSW Kensington Campus, and will take approximately 30 minutes.
   
   
   We look forward to meeting you!
   
   
   Best regards,
   {{organisation_name}} Recruitment Team`,
    },
    {
        id: 2,
        name: "Application Acceptance",
        subject: "Congratulations! Offer for {{role}} at {{organisation_name}}",
        body: `Dear {{name}},
   
   
   We are delighted to offer you the position of {{role}} for {{campaign_name}}!
   
   
   After careful consideration of all applications and interviews, we believe you would be an excellent addition to our team. Your experience and passion for technology align perfectly with our mission.
   
   
   This offer is valid until {{expiry_date}}. Please reply to this email by this date to confirm your acceptance.
   
   
   Next steps:
   1. Confirm your acceptance by replying to this email
   2. Attend the onboarding session on April 5th, 2024
   3. Complete the necessary paperwork
   
   
   We're excited to have you join the {{organisation_name}} team!
   
   
   Congratulations and welcome aboard!
   
   
   Best regards,
   {{organisation_name}} Executive Team`,
        category: "acceptance",
        createdAt: "2024-02-18T14:30:00Z",
        updatedAt: "2024-02-22T09:15:00Z",
    },
    {
        id: 3,
        name: "Application Rejection",
        subject: "Update on your {{role}} application - {{organisation_name}}",
        body: `Dear {{name}},
   
   
   Thank you for your interest in the {{role}} position for {{campaign_name}} and for taking the time to submit your application.
   
   
   After careful consideration of all applications, we have decided to move forward with other candidates whose experience more closely matches our current needs.
   
   
   This decision was not easy, as we received many high-quality applications. We encourage you to apply for future opportunities with {{organisation_name}} as they arise.
   
   
   We appreciate your interest in our organization and wish you all the best in your future endeavors.
   
   
   Best regards,
   {{organisation_name}} Recruitment Team`,
    },
    {
        id: 4,
        name: "Application Received",
        subject: "Application Received - {{campaign_name}}",
        body: `Dear {{name}},
   
   
   Thank you for submitting your application for the {{role}} position in our {{campaign_name}}.
   
   
   We have successfully received your application and our recruitment team will review it carefully. You can expect to hear back from us within the next two weeks.
   
   
   Application Details:
   - Position: {{role}}
   - Campaign: {{campaign_name}}
   - Submitted: Today
   
   
   If you have any questions about your application or the recruitment process, please don't hesitate to contact us.
   
   
   Thank you for your interest in {{organisation_name}}!
   
   
   Best regards,
   {{organisation_name}} Recruitment Team`,
    },
];

export async function getOrganisationEmailTemplates(organisationId: string): Promise<EmailTemplate[]> {
    return await apiRequest<EmailTemplate[]>(`/api/v1/organisation/${organisationId}/email_templates`);
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