import { apiRequest } from "@/lib/api";
import { ApplicationDetails } from "./application";

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

export async function getCampaign(campaignId: string): Promise<CampaignDetails> {
    return await apiRequest<CampaignDetails>(`/api/v1/campaign/${campaignId}`);
}

export interface CampaignRole {
    id: number;
    name: string;
    description: string;
    min_available: number;
    max_available: number;
    finalised: boolean;
}

export async function getCampaignRoles(campaignId: string): Promise<CampaignRole[]> {
    return await apiRequest<CampaignRole[]>(`/api/v1/campaign/${campaignId}/roles`);
}

export async function getCampaignApplications(campaignId: string): Promise<ApplicationDetails[]> {
    return await apiRequest<ApplicationDetails[]>(`/api/v1/campaign/${campaignId}/applications`);
}

export async function getCampaignDetails(orgSlug: string, campaignSlug: string): Promise<CampaignDetails> {
    // return await apiRequest<CampaignDetails>(`/api/v1/campaign/${orgSlug}/${campaignSlug}`);
    return await apiRequest<CampaignDetails>(`/api/v1/organisation/slug/${orgSlug}/campaign/slug/${campaignSlug}`);
}