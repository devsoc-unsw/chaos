import { apiRequest } from "@/lib/api";

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