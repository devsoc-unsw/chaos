import { apiRequest } from "@/lib/api";
import { ApplicationDetails } from "./application";
import { RoleUpdate } from "@/models/role";
import { AppMessage } from "./app";
import { createProperSlug } from "./slug";

export interface CampaignDetails {
    /// Unique identifier for the campaign
    id: number;
    campaign_slug: string;
    name: string;
    organisation_id: string;
    organisation_slug: string;
    organisation_name: string;
    cover_image: string | null;
    /// Optional description of the campaign
    description: string | null;
    starts_at: string;
    ends_at: string;
    published: boolean;
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


export async function getCampaign(campaignId: string): Promise<CampaignDetails> {
    return await apiRequest<CampaignDetails>(`/api/v1/campaign/${campaignId}`);
}

export async function updateCampaign(campaignId: string, campaign: CampaignUpdate): Promise<AppMessage> {
    return await apiRequest<AppMessage>(`/api/v1/campaign/${campaignId}`, {
        method: "PUT",
        body: campaign,
    });
}

export interface CampaignRole {
    id: number;
    name: string;
    description: string;
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

export async function getCampaignRoles(campaignId: string): Promise<CampaignRole[]> {
    return await apiRequest<CampaignRole[]>(`/api/v1/campaign/${campaignId}/roles`);
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

export async function getCampaignDetails(orgSlug: string, campaignSlug: string): Promise<CampaignDetails> {
    // return await apiRequest<CampaignDetails>(`/api/v1/campaign/${orgSlug}/${campaignSlug}`);
    return await apiRequest<CampaignDetails>(`/api/v1/organisation/slug/${orgSlug}/campaign/slug/${campaignSlug}`);
}