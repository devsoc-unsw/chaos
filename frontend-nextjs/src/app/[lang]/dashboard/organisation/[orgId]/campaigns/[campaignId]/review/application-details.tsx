"use client";

import { useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import {getApplication } from "@/models/application";
import { createRating, getCategoryRatingsByApplication, updateRatingComment, updateCategoryRating, 
    getRatingCategories, deleteCategoryRating, deleteRating, NewCategoryRating, createCategoryRatingFromRating } from "@/models/rating";
import { getAllCommonAnswers, getAllRoleAnswers } from "@/models/answer";
import { getAllCommonQuestions, getAllRoleQuestions, linkQuestionsAndAnswers } from "@/models/question";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useEffect } from "react";
import ApplicationRatingForm from "./application-rating-form";

export default function ApplicationDetailsComponent({ applicationId, campaignId, dict, ratedApplications, setRatedApplications, children }: { applicationId: string, campaignId: string, dict: any, ratedApplications: Record<string, boolean>, setRatedApplications: (ratedApplications: Record<string, boolean>) => void, children?: React.ReactNode;}) {
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
        setRatedApplications({
            ...ratedApplications,
            [applicationId]: true,
        });

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
        <ScrollArea className="h-full">
            <p className="text-xs text-gray-500 font-mono">{dict.common.application} #{application?.id}</p>
            <h1 className="text-2xl font-medium">{application?.user.name}</h1>

            {/* User answers */}
            <ScrollArea className="h-96 overflow-y-auto" type="auto">
                <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1">
                        <p className="text-lg font-semibold">{dict.common.common_questions}</p>
                        {linkedCommonQuestionsAnswers.map((data) => (
                            <div key={data?.question_id}>
                                <p className="text-md font-medium">{data?.text}</p>
                                <p>{JSON.stringify(data?.answer)}</p>
                            </div>
                        ))}
                    </div>

                    <Separator />

                    <div className="flex flex-col gap-3">
                        {linkedRolesQuestionsAnswers.map((data, index) => (
                            <div key={data?.id} className="flex flex-col gap-1">
                                {index > 0 && <Separator className="my-1" />}
                                <p className="text-lg font-semibold">{data?.roleName} {dict.common.questions}</p>
                                {data?.questions.map((question) => (
                                    <div key={question?.question_id}>
                                        <p className="text-md font-medium">{question?.text}</p>
                                        <p>{JSON.stringify(question?.answer)}</p>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </ScrollArea>
            <Separator className="my-4" />
            {children}
        </ScrollArea>
    );
}
