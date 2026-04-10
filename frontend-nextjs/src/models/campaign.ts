import { apiRequest } from "@/lib/api";
import { ApplicationDetails } from "./application";
import { RoleUpdate } from "@/models/role";
import { AppMessage } from "./app";
import { createProperSlug } from "./slug";

export interface CampaignDetails {
    /// Unique identifier for the campaign
    id: number; //fix this later
    campaign_slug: string;
    name: string;
    organisation_id: string;
    organisation_slug: string;
    organisation_name: string;
    contact_email: string,
    website_url: string,
    cover_image: string | null;
    cover_image_url?: string | null;
    /// Optional description of the campaign
    description: string | null;
    starts_at: string;
    ends_at: string;
    published: boolean;
    max_roles_per_application: number | null;
    interview_period_starts_at: Date | null,
    interview_period_ends_at: Date | null,
    interview_format: string | null,
    outcomes_released_at: Date | null,
    application_requirements: string | null,
}

export interface NewCampaign {
    name: string;
    slug: string;
    /// Optional description of the campaign
    description: string | null;
    starts_at: string;
    organisation_id: string;
    ends_at: string;
}

export interface CampaignUpdate {
    slug: string;
    name: string;
    description: string;
    starts_at: string;
    ends_at: string;
}

export interface CampaignAttachment {
    id: number;
    campaign_id: string;
    file_name: string;
    file_size: number;
    download_url: string;
}

export interface AttachmentUpload {
    upload_url: string;
    attachment_id: string;
}

export interface NewAttachment {
    file_name: string;
    file_size: number;
}

export async function getCampaignAttachments(campaignId: string): Promise<CampaignAttachment[] | null> {
    try {
        const result = await apiRequest<CampaignAttachment[] | null>(`/api/v1/campaign/${campaignId}/attachments`);
        // Backend returns null if document doesn't exist (200 OK with null body)
        return result;
    } catch (error) {
        // Fallback error handling - return null to prevent UI breaking
        console.error("Error fetching attachments:", error);
        return null;
    }
}

export async function uploadAttachments(campaignId: string, files: File[]): Promise<AttachmentUpload[]> {
    const uploadData: NewAttachment[] = files.map(file => ({
        file_name: file.name,
        file_size: file.size,
    }));    
    return await apiRequest<AttachmentUpload[]>(`/api/v1/campaign/${campaignId}/attachments`, {
        method: "PATCH",
        body: uploadData,
    });
}

export async function deleteCampaignAttachment(attachmentId: number): Promise<void> {
    await apiRequest<void>(`/api/v1/campaign/attachment/${attachmentId}`, {
        method: "DELETE",
    });
}

export async function getCampaign(campaignId: string): Promise<CampaignDetails> {
    return await apiRequest<CampaignDetails>(`/api/v1/campaign/${campaignId}`);
}

export interface CampaignRole {
    id: number;
    name: string;
    description: string;
}

export async function updateCampaign(campaignId: string, campaign: CampaignUpdate): Promise<AppMessage> {
    return await apiRequest<AppMessage>(`/api/v1/campaign/${campaignId}`, {
        method: "PUT",
        body: campaign,
    });
}

export interface RoleDetails {
    id: string;
    campaign_id: string;
    name: string;
    description?: string;
    min_available: number;
    max_available: number;
    finalised: boolean;
}

export async function createCampaign(name: string, description: string, startsAt: string, endsAt: string, organisationId: string, slug?: string): Promise<{ id: string }> {
    if (!slug) {
        slug = createProperSlug(name);
    }
    
    return await apiRequest<{ id: string }>(`/api/v1/organisation/${organisationId}/campaign`, {
        method: "POST", body: {
            slug,
            name,
            description,
            starts_at: startsAt,
            ends_at: endsAt,
        }
    });
}

export interface SlugCheck {
    slug: string,
}

export async function checkCampaignSlugAvailability(orgId: string, slug: string): Promise<AppMessage> {
    return await apiRequest<AppMessage>(`/api/v1/organisation/${orgId}/campaign/slug_check`, {
        method: "POST",
        body: {
            slug,
        }
    });
}

export interface CampaignBannerUpdate {
    upload_url: string,
}

export async function setCampaignCoverImage(campaignId: string): Promise<CampaignBannerUpdate> {
    return await apiRequest<CampaignBannerUpdate>(`/api/v1/campaign/${campaignId}/banner`, { method: "PATCH" });
}

export async function getCampaignRoles(campaignId: string): Promise<RoleDetails[]> {
    return await apiRequest<RoleDetails[]>(`/api/v1/campaign/${campaignId}/roles`);
}

export async function createCampaignRole(campaignId: string, role: RoleUpdate): Promise<AppMessage> {
    return await apiRequest<AppMessage>(`/api/v1/campaign/${campaignId}/role`, {
        method: "POST",
        body: role,
    });
}

export async function getCampaignApplications(campaignId: string): Promise<ApplicationDetails[]> {
    return await apiRequest<ApplicationDetails[]>(`/api/v1/campaign/${campaignId}/applications`);
}

export async function getCampaignBySlugs(orgSlug: string, campaignSlug: string): Promise<CampaignDetails> {
    // return await apiRequest<CampaignDetails>(`/api/v1/campaign/${orgSlug}/${campaignSlug}`);
    return await apiRequest<CampaignDetails>(`/api/v1/organisation/slug/${orgSlug}/campaign/slug/${campaignSlug}`);
}

export async function publishCampaign(campaignId: string): Promise<AppMessage> {
    return await apiRequest<AppMessage>(`/api/v1/campaign/${campaignId}/publish`, {
        method: "PATCH",
    });
}