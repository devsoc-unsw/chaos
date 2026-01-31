import { AppMessage } from "./app";
import { apiRequest } from "@/lib/api";

export interface NewCateogry {
    name: string;
}

export interface RatingCategory {
    id: string;
    campaign_id: string;
    name: string;
}

export interface RatingDetails {
    id: string;
    rater_id: string;
    rater_name: string;
    comment: string | null;
    category_ratings: CategoryRatingDetail[];
    updated_at: string;
}

export interface CategoryRatingDetail {
    id: string; 
    campaign_rating_category_id: string;
    category_name: string;
    rating: number | null; // if no rating, then null
}

export interface NewCategoryRating {
    campaign_rating_category_id: string;
    rating: number;
}

export async function getRatingCategories(campaignId: string): Promise<RatingCategory[]> {
    return await apiRequest<RatingCategory[]>(`/api/v1/campaign/${campaignId}/rating_categories`, {
        method: "GET",
    });
}

export async function createCategory(name: string, campaignId: string) {
    return await apiRequest<{ id: string }>(`/api/v1/campaign/${campaignId}/rating_category`, {
        method: "POST", body: {
            name,
        }
    });
}

export async function updateCategory(name: string, campaignId: string, categoryId: string): Promise<AppMessage> {
    return await apiRequest<AppMessage>(`/api/v1/campaign/${campaignId}/rating_category/${categoryId}`, {
        method: "PATCH",
        body: {
            name,
        },
    });
}

export async function deleteCategory(campaignId: string, categoryId: string): Promise<AppMessage> {
    return await apiRequest<AppMessage>(`/api/v1/campaign/${campaignId}/rating_category/${categoryId}`, {
        method: "DELETE",
    });
}

export async function createRating(applicationId: string, comment: string | null, categoryRatings: Array<{campaign_rating_category_id: string, rating: number}>): Promise<AppMessage> {
    return await apiRequest<AppMessage>(`/api/v1/application/${applicationId}/rating`, {
        method: "POST",
        body: {
            comment,
            category_ratings: categoryRatings,
        },
    });
}

export async function getCategoryRatingsByApplication(applicationId: string): Promise<RatingDetails[]> {
    return await apiRequest<RatingDetails[]>(`/api/v1/application/${applicationId}/rating`, {
        method: "GET",
    });
}

export async function updateRatingComment(ratingId: string, comment: string | null): Promise<AppMessage> {
    return await apiRequest<AppMessage>(`/api/v1/rating/${ratingId}`, {
        method: "PATCH",
        body: {
            comment,
        },
    });
}

export async function createCategoryRatingFromRating(ratingId: string, categoryRating: NewCategoryRating): Promise<AppMessage> {
    return await apiRequest<AppMessage>(`/api/v1/rating/${ratingId}/category`, {
        method: "POST",
        body: {
            campaign_rating_category_id: categoryRating.campaign_rating_category_id,
            rating: categoryRating.rating,
        },
    });
}

export async function updateCategoryRating(ratingId: string, categoryRatingId: string, rating: number): Promise<AppMessage> {
    return await apiRequest<AppMessage>(`/api/v1/rating/${ratingId}/category/${categoryRatingId}`, {
        method: "PATCH",
        body: {
            rating,
        },
    });
}

export async function deleteCategoryRating(ratingId: string, categoryRatingId: string): Promise<AppMessage> {
    return await apiRequest<AppMessage>(`/api/v1/rating/${ratingId}/category/${categoryRatingId}`, {
        method: "DELETE",
    });
}

export async function deleteRating(ratingId: string): Promise<AppMessage> {
    return await apiRequest<AppMessage>(`/api/v1/rating/${ratingId}`, {
        method: "DELETE",
    });
}



