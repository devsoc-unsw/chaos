"use client";

import { useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { getApplication } from "@/models/application";
import {
    createRating, getCategoryRatingsByApplication, updateRatingComment, updateCategoryRating,
    getRatingCategories, NewCategoryRating, createCategoryRatingFromRating
} from "@/models/rating";
import { getAllCommonAnswers, getAllRoleAnswers } from "@/models/answer";
import { getAllCommonQuestions, getAllRoleQuestions, linkQuestionsAndAnswers } from "@/models/question";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react";

export default function ApplicationRatingForm({ applicationId, campaignId, dict }: { applicationId: string, campaignId: string, dict: any }) {
    const queryClient = useQueryClient();

    const { data: application } = useQuery({
        queryKey: [`${applicationId}-application-details`],
        queryFn: () => getApplication(applicationId),
        enabled: !!applicationId,
    });

    const { data: commonQuestions } = useQuery({
        queryKey: [`${campaignId}-common-questions`],
        queryFn: () => getAllCommonQuestions(campaignId),
    });

    const { data: commonAnswers } = useQuery({
        queryKey: [`${applicationId}-common-answers`],
        queryFn: () => getAllCommonAnswers(applicationId),
    });

    const { data: ratingCategories } = useQuery({
        queryKey: [`${campaignId}-rating-categories`],
        queryFn: () => getRatingCategories(campaignId),
    });

    const linkedCommonQuestionsAnswers = linkQuestionsAndAnswers(commonQuestions ?? [], commonAnswers ?? []);

    const roles = application?.applied_roles ?? [];

    const roleQuestionsQueries = useQueries({
        queries: roles.map((role) => ({
            queryKey: [`${campaignId}-role-questions-${role.campaign_role_id}`],
            queryFn: () => getAllRoleQuestions(campaignId, role.campaign_role_id),
        }))
    });

    const roleAnswersQueries = useQueries({
        queries: roles.map((role) => ({
            queryKey: [`${applicationId}-role-answers-${role.campaign_role_id}`],
            queryFn: () => getAllRoleAnswers(applicationId, role.campaign_role_id),
        }))
    });

    const { data: applicationRating } = useQuery({
        queryKey: [`${applicationId}-application-rating`],
        // queryFn: () => getApplicationRating(applicationId),
        queryFn: () => getCategoryRatingsByApplication(applicationId),
    });


    // Get existing rating if user has already rated this application
    const originalRating = applicationRating?.[0];
    const hasRated = originalRating !== undefined;

    // let originalRating = applicationRating?.rating;
    // let originalComment = applicationRating?.comment;

    // const hasRated = applicationRating?.rating !== undefined;
    // const [rating, setRating] = useState<number | undefined>(undefined);
    // const [comment, setComment] = useState<string | undefined>(undefined);

    const [categoryRatings, setCategoryRatings] = useState<NewCategoryRating[]>([]);
    const [comment, setComment] = useState<string | undefined>(undefined);

    // useEffect(() => {
    //     setRating(undefined);
    //     setComment(undefined);
    // }, [applicationId]);

    useEffect(() => {
        if (originalRating?.category_ratings) {
            setCategoryRatings(originalRating.category_ratings.filter(cr => cr.rating !== null)
                .map(cr => ({ campaign_rating_category_id: cr.campaign_rating_category_id, rating: cr.rating! }))
            );
        } else {
            setCategoryRatings([]);
        }
        setComment(undefined);
    }, [applicationId, applicationRating]);

    // const handleSubmitRating = async () => {       
    //     let sendingRating = rating;
    //     let sendingComment = comment;
    //     
    //     if (!rating) {
    //         sendingRating = originalRating;
    //     }
    //     if (!comment) {
    //         sendingComment = originalComment ?? "";
    //     }
    //     
    //     if (hasRated) {
    //         await updateApplicationRating(applicationId, sendingRating, sendingComment);
    //     } else {
    //         await createApplicationRating(applicationId, sendingRating, sendingComment);
    //     }
    // };

    const handleSubmitRating = async () => {
        const sendingComment = comment ?? originalRating?.comment ?? null;

        if (hasRated && originalRating) {
            // Update existing rating
            if (comment !== undefined) {
                await updateRatingComment(originalRating.id, sendingComment);
            }

            for (const categoryRating of categoryRatings) {
                const existing = originalRating.category_ratings.find(
                    cr => cr.campaign_rating_category_id === categoryRating.campaign_rating_category_id
                );

                if (existing) {
                    if (existing.rating !== categoryRating.rating) {
                        await updateCategoryRating(originalRating.id, existing.id, categoryRating.rating);
                    }
                } else {
                    await createCategoryRatingFromRating(originalRating.id, categoryRating);
                }
            }
        } else {
            // Create new rating
            await createRating(applicationId, sendingComment, categoryRatings);
        }

        // setRating(undefined);
        setCategoryRatings([]);
        setComment(undefined);

        await queryClient.invalidateQueries({ queryKey: [`${applicationId}-application-rating`] });
        await queryClient.invalidateQueries({ queryKey: [`${applicationId}-application-details`] });
        await queryClient.invalidateQueries({ queryKey: [`${campaignId}-campaign-applications`] });
    };

    const handleCategoryRatingChange = (categoryId: string, value: string) => {
        const rating = Number(value);
        setCategoryRatings(prev => {
            const existing = prev.find(cr => cr.campaign_rating_category_id === categoryId);
            if (existing) {
                return prev.map(cr =>
                    cr.campaign_rating_category_id === categoryId
                        ? { ...cr, rating }
                        : cr
                );
            }
            return [...prev, { campaign_rating_category_id: categoryId, rating }];
        });
    };

    const getCategoryCurrentRating = (categoryId: string) => {
        return categoryRatings.find(cr => cr.campaign_rating_category_id === categoryId)?.rating ??
            originalRating?.category_ratings?.find(cr => cr.campaign_rating_category_id === categoryId)?.rating;
    };

    const getCategoryRatingValue = (categoryId: string): string => {
        const rating = getCategoryCurrentRating(categoryId);
        return rating !== null && rating !== undefined ? rating.toString() : "";
    };

    const rolesQuestionsAnswers = roles.map((role, index) => {
        return {
            id: role.campaign_role_id,
            roleName: role.role_name,
            questions: roleQuestionsQueries[index]?.data ?? [],
            answers: roleAnswersQueries[index]?.data ?? [],
        };
    });

    const linkedRolesQuestionsAnswers = rolesQuestionsAnswers.map((data) => {
        return {
            id: data.id,
            roleName: data.roleName,
            questions: linkQuestionsAndAnswers(data.questions, data.answers),
        };
    });

    return (
        <div className="flex flex-col gap-2">
            <p className="text-lg font-semibold">{dict.dashboard.campaigns.application_review_page.application_rating}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                {ratingCategories?.map((category) => (
                    <div key={category.id} className="flex flex-col gap-2">
                        <Label htmlFor={`category-${category.id}`}>{category.name}</Label>
                        <Select
                            value={getCategoryRatingValue(category.id)}
                            onValueChange={(value) => handleCategoryRatingChange(category.id, value)}
                        >
                            <SelectTrigger className="w-[180px]" id={`category-${category.id}`}>
                                <SelectValue placeholder={dict.dashboard.campaigns.application_review_page.review_score} />
                            </SelectTrigger>
                            <SelectContent>
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                                    <SelectItem key={value} value={`${value}`}>{value}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                ))}
            </div>

            <div className="flex flex-col gap-2 mb-4">
                <Label htmlFor="reviewComment">{dict.dashboard.campaigns.application_review_page.review_comment}</Label>
                <Textarea
                    className="min-h-[100px]"
                    id="reviewComment"
                    placeholder={dict.dashboard.campaigns.application_review_page.write_your_review_here}
                    value={comment ?? originalRating?.comment ?? ""}
                    onChange={(e) => setComment(e.target.value)}
                />
            </div>
            <div>
                <Button
                    disabled={categoryRatings.length === 0 && comment === undefined}
                    onClick={handleSubmitRating}
                >
                    Submit
                </Button>
            </div>
        </div>
    );
}