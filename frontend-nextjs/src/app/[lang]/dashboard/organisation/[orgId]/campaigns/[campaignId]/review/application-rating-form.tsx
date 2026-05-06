"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
    createRating,
    getCategoryRatingsByApplication,
    updateRatingComment,
    updateCategoryRating,
    getRatingCategories,
    NewCategoryRating,
    createCategoryRatingFromRating,
} from "@/models/rating";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

function StarRow({ value, onChange }: { value: number; onChange: (v: number) => void }) {
    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    onClick={() => onChange(star)}
                    className="hover:scale-110 transition-transform"
                >
                    <svg
                        className={cn(
                            "w-6 h-6",
                            star <= value
                                ? "text-yellow-400 fill-yellow-400"
                                : "fill-none text-muted-foreground",
                        )}
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                        />
                    </svg>
                </button>
            ))}
        </div>
    );
}

export default function ApplicationRatingForm({
    applicationId,
    campaignId,
    dict,
    ratedApplications,
    setRatedApplications,
}: {
    applicationId: string;
    campaignId: string;
    dict: any;
    ratedApplications: Record<string, boolean>;
    setRatedApplications: (v: Record<string, boolean>) => void;
}) {
    const queryClient = useQueryClient();

    const { data: ratingCategories } = useQuery({
        queryKey: [`${campaignId}-rating-categories`],
        queryFn: () => getRatingCategories(campaignId),
    });

    const { data: applicationRating } = useQuery({
        queryKey: [`${applicationId}-application-rating`],
        queryFn: () => getCategoryRatingsByApplication(applicationId),
    });

    const originalRating = applicationRating?.[0];
    const hasRated = originalRating !== undefined;

    const [categoryRatings, setCategoryRatings] = useState<NewCategoryRating[]>([]);
    const [comment, setComment] = useState<string | undefined>(undefined);

    useEffect(() => {
        if (originalRating?.category_ratings) {
            setCategoryRatings(
                originalRating.category_ratings
                    .filter((cr) => cr.rating !== null)
                    .map((cr) => ({
                        campaign_rating_category_id: cr.campaign_rating_category_id,
                        rating: cr.rating!,
                    }))
            );
        } else {
            setCategoryRatings([]);
        }
        setComment(undefined);
    }, [applicationId, applicationRating]);

    const getCategoryRatingValue = (categoryId: string): number => {
        const local = categoryRatings.find((cr) => cr.campaign_rating_category_id === categoryId);
        if (local) return local.rating;
        return (
            originalRating?.category_ratings?.find(
                (cr) => cr.campaign_rating_category_id === categoryId
            )?.rating ?? 0
        );
    };

    const handleStarChange = (categoryId: string, rating: number) => {
        setCategoryRatings((prev) => {
            const existing = prev.find((cr) => cr.campaign_rating_category_id === categoryId);
            if (existing) {
                return prev.map((cr) =>
                    cr.campaign_rating_category_id === categoryId ? { ...cr, rating } : cr
                );
            }
            return [...prev, { campaign_rating_category_id: categoryId, rating }];
        });
    };

    const handleSubmit = async () => {
        const sendingComment = comment ?? originalRating?.comment ?? null;

        if (hasRated && originalRating) {
            if (comment !== undefined) {
                await updateRatingComment(originalRating.id, sendingComment);
            }
            for (const cr of categoryRatings) {
                const existing = originalRating.category_ratings.find(
                    (e) => e.campaign_rating_category_id === cr.campaign_rating_category_id
                );
                if (existing) {
                    if (existing.rating !== cr.rating) {
                        await updateCategoryRating(originalRating.id, existing.id, cr.rating);
                    }
                } else {
                    await createCategoryRatingFromRating(originalRating.id, cr);
                }
            }
        } else {
            await createRating(applicationId, sendingComment, categoryRatings);
        }

        setCategoryRatings([]);
        setComment(undefined);
        setRatedApplications({ ...ratedApplications, [applicationId]: true });

        await queryClient.invalidateQueries({ queryKey: [`${applicationId}-application-rating`] });
        await queryClient.invalidateQueries({ queryKey: [`${applicationId}-application-details`] });
        await queryClient.invalidateQueries({ queryKey: [`${campaignId}-campaign-applications`] });
    };

    const hasChanges = categoryRatings.length > 0 || comment !== undefined;

    return (
        <div className="flex flex-col gap-6">
            {ratingCategories?.map((category) => (
                <div key={category.id} className="flex flex-col gap-2">
                    <p className="text-sm font-semibold">{category.name}</p>
                    <StarRow
                        value={getCategoryRatingValue(category.id)}
                        onChange={(v) => handleStarChange(category.id, v)}
                    />
                </div>
            ))}

            <div className="flex flex-col gap-2">
                <Label htmlFor="reviewComment">
                    {dict.dashboard.campaigns.application_review_page.review_comment}
                </Label>
                <Textarea
                    id="reviewComment"
                    className="min-h-25"
                    placeholder={dict.dashboard.campaigns.application_review_page.write_your_review_here}
                    value={comment ?? originalRating?.comment ?? ""}
                    onChange={(e) => setComment(e.target.value)}
                />
            </div>

            <Button disabled={!hasChanges} onClick={handleSubmit}>
                Submit
            </Button>
        </div>
    );
}
