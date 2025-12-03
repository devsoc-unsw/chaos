import { apiRequest } from "@/lib/api";

export interface RoleUpdate {
    name: string;
    description?: string;
    min_available: number;
    max_available: number;
    finalised: boolean;
}

export async function updateRole(roleId: string, role: RoleUpdate): Promise<void> {
    return await apiRequest<void>(`/api/v1/role/${roleId}`, {
        method: "PATCH",
        body: role,
    });
}

export async function deleteRole(roleId: string): Promise<void> {
    return await apiRequest<void>(`/api/v1/role/${roleId}`, {
        method: "DELETE",
    });
}