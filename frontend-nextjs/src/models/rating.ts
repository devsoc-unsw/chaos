import { AppMessage } from "./app";
import { apiRequest } from "@/lib/api";

export interface NewCateogry {
    name: string;
}

export async function createCategory(name: string, campaignId: string) {
    return await apiRequest<{ id: string }>(`/api/v1/campaign/${campaignId}/rating_category`, {
        method: "POST", body: {
            name,
        }
    });
}