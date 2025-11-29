import { apiRequest } from "@/lib/api";
import { UserDetails } from "./user";

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

export interface ApplicationDetails {
    id: string;
    campaign_id: string;
    user: UserDetails;
    status: ApplicationStatus;
    private_status: ApplicationStatus;
    applied_roles: ApplicationAppliedRoleDetails[];
}

export type ApplicationStatus = "Pending" | "Rejected" | "Successful";

export interface ApplicationAppliedRoleDetails {
    campaign_role_id: string;
    role_name: string;
    preference: number;
}

export async function getCampaignApplications(campaignId: string): Promise<ApplicationDetails[]> {
    return await apiRequest<ApplicationDetails[]>(`/api/v1/campaign/${campaignId}/applications`);
}