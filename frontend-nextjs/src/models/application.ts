import { apiRequest } from "@/lib";
import { UserDetails } from "./user";
import { AppMessage } from "./app";

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

export async function getApplication(applicationId: string): Promise<ApplicationDetails> {
    return await apiRequest<ApplicationDetails>(`/api/v1/application/${applicationId}`);
}

export interface RatingDetails {
    /// Unique identifier for the rating
    id: string;
    rater_id: string;
    rater_name: string;
    rating: number;
    comment: string | null;
    updated_at: string;
}

export async function getApplicationRating(applicationId: string): Promise<RatingDetails> {
    return await apiRequest<RatingDetails>(`/api/v1/application/${applicationId}/rating`);
}

export async function createApplicationRating(applicationId: string, rating?: number, comment?: string): Promise<AppMessage> {
    return await apiRequest<AppMessage>(`/api/v1/application/${applicationId}/rating`, {
        method: "POST",
        body: {
            rating,
            comment,
        },
    });
}

export async function updateApplicationRating(applicationId: string, rating?: number, comment?: string): Promise<AppMessage> {
    return await apiRequest<AppMessage>(`/api/v1/application/${applicationId}/rating`, {
        method: "PUT",
        body: {
            rating,
            comment,
        },
    });
}

export interface UserAvgApplicationRating {
    application_id: string;
    campaign_role_id: string;
    campaign_role_name: string;
    user_name: string;
    user_email: string;
    status: ApplicationStatus;
    avg_rating: number | null;
}

export async function getApplicationAvgRatings(campaignId: string): Promise<UserAvgApplicationRating[]> {
    return await apiRequest<UserAvgApplicationRating[]>(`/api/v1/campaign/${campaignId}/avg_ratings`);
}