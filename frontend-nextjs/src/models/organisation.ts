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

export interface Member {
    id: string,
    name: string,
    email: string,
    role: OrganisationRole,
}

export async function getOrganisationAdmins(orgId: string): Promise<Member[]> {
    return await apiRequest<Member[]>(`/api/v1/organisation/${orgId}/admins`);
}

export async function updateOrganisationAdmins(orgId: string, memberIds: string[]): Promise<AppMessage> {
    return await apiRequest<AppMessage>(`/api/v1/organisation/${orgId}/admins`, {
        method: "PUT",
        body: { members: memberIds.map((id) => Number(id)) },
    });
}

export async function updateOrganisationMemberRole(
    orgId: string,
    userId: string,
    role: OrganisationRole
): Promise<AppMessage> {
    return await apiRequest<AppMessage>(`/api/v1/organisation/${orgId}/member`, {
        method: "PUT",
        body: { user_id: Number(userId), role },
    });
}

export async function getOrganisationUsers(orgId: string): Promise<Member[]> {
    return await apiRequest<Member[]>(`/api/v1/organisation/${orgId}/users`);
}

export async function getAllOrganisationMembers(orgId: string): Promise<Member[]> {
    return await apiRequest<Member[]>(`/api/v1/organisation/${orgId}/members`);
}

export async function inviteOrganisationUser(orgId: string, email: string): Promise<AppMessage> {
    return await apiRequest<AppMessage>(`/api/v1/organisation/${orgId}/user`, {
        method: "POST",
        body: {
            email: email,
        },
    });
}

export async function deleteOrganisationUser(orgId: string, memberId: string): Promise<AppMessage> {
    return await apiRequest<AppMessage>(`/api/v1/organisation/${orgId}/user`, {
        method: "DELETE",
        body: {
            user_id: memberId,
        },
    });
}