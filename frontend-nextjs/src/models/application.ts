import { apiRequest } from "@/lib";
import { UserDetails } from "./user";
import { AppMessage } from "./app";
import { RatingDetails } from "./rating";


export interface ApplicationDetails {
    id: string;
    campaign_id: string;
    user: UserDetails;
    status: ApplicationStatus;
    private_status: ApplicationStatus;
    applied_roles: ApplicationAppliedRoleDetails[];
    current_user_rated: boolean;
}

export type ApplicationStatus = "Pending" | "Rejected" | "Successful";

export interface ApplicationAppliedRoleDetails {
    campaign_role_id: string;
    role_name: string;
    preference: number;
}
export async function createOrGetApplication(campaignId: string): Promise<{ application_id: string }> {
    return await apiRequest<{ application_id: string }>(`/api/v1/campaign/${campaignId}/apply`, {
      method: "POST",
    });
}

export async function getApplication(applicationId: string): Promise<ApplicationDetails> {
    return await apiRequest<ApplicationDetails>(`/api/v1/application/${applicationId}`);
}

export async function getInProgressApplication(applicationId: string): Promise<ApplicationDetails> {
    return await apiRequest<ApplicationDetails>(`/api/v1/application/${applicationId}/inprogress`);
}
// export async function getApplicationRating(applicationId: string): Promise<RatingDetails> {
//     return await apiRequest<RatingDetails>(`/api/v1/application/${applicationId}/rating`);
// }

// export async function createApplicationRating(applicationId: string, rating?: number, comment?: string): Promise<AppMessage> {
//     return await apiRequest<AppMessage>(`/api/v1/application/${applicationId}/rating`, {
//         method: "POST",
//         body: {
//             rating,
//             comment,
//         },
//     });
// }

export async function updateApplicationRating(applicationId: string, rating?: number, comment?: string): Promise<AppMessage> {
    return await apiRequest<AppMessage>(`/api/v1/application/${applicationId}/rating`, {
        method: "PUT",
        body: {
            rating,
            comment,
        },
    });
}

export async function submitApplication(applicationId: string) {
    return await apiRequest<void>(`/api/v1/application/${applicationId}/submit`, {
        method: "POST"
    });
}

export interface ApplicationRatingSummary {
    application_id: string;
    applied_roles: string[];
    user_name: string;
    user_email: string;
    status: ApplicationStatus;
    updated_at: string;
    ratings: RatingDetails[];
}

export async function getApplicationRatingsSummary(campaignId: string): Promise<ApplicationRatingSummary[]> {
    return await apiRequest<ApplicationRatingSummary[]>(`/api/v1/campaign/${campaignId}/avg_ratings`);
}
