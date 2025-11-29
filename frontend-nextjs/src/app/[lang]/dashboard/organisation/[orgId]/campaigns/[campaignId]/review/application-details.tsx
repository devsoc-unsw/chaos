"use client";

import { useQueries, useQuery } from "@tanstack/react-query";
import { getApplication } from "@/models/application";
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

export default function ApplicationDetailsComponent({ applicationId, campaignId, dict }: { applicationId: string, campaignId: string, dict: any }) {
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
        <div>
            <ScrollArea className="h-full">
                <p className="text-sm text-gray-500 font-mono">#{application?.id}</p>
                <h1 className="text-2xl font-medium">{application?.user.name}</h1>
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
                            <div className="flex flex-col gap-1">
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

                <Separator className="my-4" />

                <div className="flex flex-col gap-2">
                    <p className="text-lg font-semibold">{dict.dashboard.campaigns.application_review_page.application_rating}</p>
                    
                    <Label htmlFor="reviewScore">{dict.dashboard.campaigns.application_review_page.review_score}</Label>
                    <Select>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder={dict.dashboard.campaigns.application_review_page.review_score} />
                        </SelectTrigger>
                        <SelectContent>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                                <SelectItem value={`${value}`}>{value}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Label htmlFor="reviewComment">{dict.dashboard.campaigns.application_review_page.review_comment}</Label>
                    <Textarea className="min-h-[100px]" id="reviewComment" placeholder={dict.dashboard.campaigns.application_review_page.write_your_review_here} />
                    <div>
                    <Button>Submit</Button>
                    </div>
                </div>
            </ScrollArea>
        </div>
    );
}
