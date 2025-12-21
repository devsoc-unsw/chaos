"use client";

import { useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { createApplicationRating, getApplication, getApplicationRating, updateApplicationRating } from "@/models/application";
import { getAllCommonAnswers, getAllRoleAnswers } from "@/models/answer";
import { getAllCommonQuestions, getAllRoleQuestions, linkQuestionsAndAnswers } from "@/models/question";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
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

export default function ApplicationDetailsComponent({ applicationId, campaignId, dict, ratedApplications, setRatedApplications }: { applicationId: string, campaignId: string, dict: any, ratedApplications: Record<string, boolean>, setRatedApplications: (ratedApplications: Record<string, boolean>) => void }) {
    const queryClient = useQueryClient();
    
    const { data: application } = useQuery({
        queryKey: [`${applicationId}-application-details`],
        queryFn: () => getApplication(applicationId),
        enabled: !!applicationId,
    });

    const { data: commonQuestions } = useQuery({
        queryKey: [`${applicationId}-common-questions`],
        queryFn: () => getAllCommonQuestions(campaignId),
    });

    const { data: commonAnswers } = useQuery({
        queryKey: [`${applicationId}-common-answers`],
        queryFn: () => getAllCommonAnswers(applicationId),
    });

    const linkedCommonQuestionsAnswers = linkQuestionsAndAnswers(commonQuestions ?? [], commonAnswers ?? []);

    const roles = application?.applied_roles ?? [];

    const roleQuestionsQueries = useQueries({
        queries: roles.map((role) => ({
            queryKey: [`${applicationId}-role-questions-${role.campaign_role_id}`],
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
        queryFn: () => getApplicationRating(applicationId),
    });

    let originalRating = applicationRating?.rating;
    let originalComment = applicationRating?.comment;

    const hasRated = applicationRating?.rating !== undefined;
    const [rating, setRating] = useState<number | undefined>(undefined);
    const [comment, setComment] = useState<string | undefined>(undefined);

    useEffect(() => {
        setRating(undefined);
        setComment(undefined);
    }, [applicationId]);

    const handleSubmitRating = async () => {       
        let sendingRating = rating;
        let sendingComment = comment;
        
        if (!rating) {
            sendingRating = originalRating;
        }

        if (!comment) {
            sendingComment = originalComment ?? "";
        }
        
        if (hasRated) {
            await updateApplicationRating(applicationId, sendingRating, sendingComment);
        } else {
            await createApplicationRating(applicationId, sendingRating, sendingComment);
        }

        setRating(undefined);
        setComment(undefined);
        setRatedApplications({
            ...ratedApplications,
            [applicationId]: true,
        });


        await queryClient.invalidateQueries({ queryKey: [`${applicationId}-application-rating`] });
        await queryClient.invalidateQueries({ queryKey: [`${applicationId}-application-details`] });
        await queryClient.invalidateQueries({ queryKey: [`${campaignId}-campaign-applications`] });
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
                                <p>{data?.answer}</p>
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
                                        <p>{question?.answer}</p>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </ScrollArea>

            <Separator className="my-4" />

            {/* Rating form */}
            <div className="flex flex-col gap-2">
                <p className="text-lg font-semibold">{dict.dashboard.campaigns.application_review_page.application_rating}</p>

                <Label htmlFor="reviewScore">{dict.dashboard.campaigns.application_review_page.review_score}</Label>
                {/* TODO: Put into flexbox and dynamically add different columns for different categories */}
                <Select value={rating?.toString() ?? originalRating?.toString() ?? ""} onValueChange={(value) => setRating(Number(value))}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder={dict.dashboard.campaigns.application_review_page.review_score} />
                    </SelectTrigger>
                    <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                            <SelectItem key={value} value={`${value}`}>{value}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Label htmlFor="reviewComment">{dict.dashboard.campaigns.application_review_page.review_comment}</Label>
                <Textarea
                    className="min-h-[100px]" id="reviewComment"
                    placeholder={dict.dashboard.campaigns.application_review_page.write_your_review_here}
                    value={(comment || comment == "") ? comment : (originalComment ?? "")}
                    onChange={(e) => setComment(e.target.value)}
                />
                <div>
                    <Button disabled={rating === undefined && comment === undefined} onClick={handleSubmitRating}>Submit</Button>
                </div>
            </div>

        </ScrollArea>
    );
}
