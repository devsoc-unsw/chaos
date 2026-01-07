import { apiRequest } from "@/lib/api";
import { AppMessage } from "./app";

export type OrganisationDetails = {
    id: string,
    slug: string,
    name: string,
    logo: string | null,
    created_at: string,
};

export async function getAllOrganisations(): Promise<OrganisationDetails[]> {
    return await apiRequest<OrganisationDetails[]>("/api/v1/user/organisations");
}

export async function getOrganisationById(orgId: string): Promise<OrganisationDetails> {
    return await apiRequest<OrganisationDetails>(`/api/v1/organisation/${orgId}`);
}

export type OrganisationCampaign = {
    /// Unique identifier for the campaign
    id: string,
    organisation_id: string,
    campaign_slug: string,
    organisation_slug: string,
    name: string,
    cover_image: string | null,
    description: string | null,
    starts_at: string,
    ends_at: string,
    published: boolean,
}

export async function getOrganisationCampaigns(orgId: string): Promise<OrganisationCampaign[]> {
    return await apiRequest<OrganisationCampaign[]>(`/api/v1/organisation/${orgId}/campaigns`);
}

export type OrganisationRole = "User" | "Admin";

export type OrganisationUserRole = {
    role: OrganisationRole | null,
}

export async function getOrganisationUserRole(orgId: string): Promise<OrganisationUserRole> {
    return await apiRequest<OrganisationUserRole>(`/api/v1/organisation/${orgId}/role`);
}