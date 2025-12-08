import { apiRequest } from "@/lib/api";
import { AppMessage } from "./app";

export interface RoleUpdate {
    name: string;
    description?: string;
    min_available: number;
    max_available: number;
    finalised: boolean;
}

export async function updateRole(roleId: string, role: RoleUpdate): Promise<AppMessage> {
    return await apiRequest<AppMessage>(`/api/v1/role/${roleId}`, {
        method: "PATCH",
        body: role,
    });
}

export async function deleteRole(roleId: string): Promise<AppMessage> {
    return await apiRequest<AppMessage>(`/api/v1/role/${roleId}`, {
        method: "DELETE",
    });
}