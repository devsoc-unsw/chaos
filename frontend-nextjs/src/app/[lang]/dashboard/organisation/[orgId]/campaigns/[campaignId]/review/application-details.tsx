"use client";

import { useQueries, useQuery } from "@tanstack/react-query";
import { getApplication } from "@/models/application";
import { getAllCommonAnswers, getAllRoleAnswers } from "@/models/answer";
import { getAllCommonQuestions, getAllRoleQuestions, linkQuestionsAndAnswers } from "@/models/question";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function ApplicationDetailsComponent({
    applicationId,
    campaignId,
    dict,
    selectedRoleId,
}: {
    applicationId: string;
    campaignId: string;
    dict: any;
    selectedRoleId?: string | null;
}) {
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

    const linkedCommonQuestionsAnswers = linkQuestionsAndAnswers(commonQuestions ?? [], commonAnswers ?? []);

    const roles = application?.applied_roles ?? [];

    const roleQuestionsQueries = useQueries({
        queries: roles.map((role) => ({
            queryKey: [`${campaignId}-role-questions-${role.campaign_role_id}`],
            queryFn: () => getAllRoleQuestions(campaignId, role.campaign_role_id),
        })),
    });

    const roleAnswersQueries = useQueries({
        queries: roles.map((role) => ({
            queryKey: [`${applicationId}-role-answers-${role.campaign_role_id}`],
            queryFn: () => getAllRoleAnswers(applicationId, role.campaign_role_id),
        })),
    });

    const linkedRolesQuestionsAnswers = roles
        .map((role, index) => ({
            id: role.campaign_role_id,
            roleName: role.role_name,
            questions: linkQuestionsAndAnswers(
                roleQuestionsQueries[index]?.data ?? [],
                roleAnswersQueries[index]?.data ?? []
            ),
        }))
        .filter((r) => !selectedRoleId || r.id === selectedRoleId);

    return (
        <ScrollArea className="h-full">
            <div className="flex flex-col gap-6 p-6">
                {linkedCommonQuestionsAnswers.length > 0 && (
                    <div className="flex flex-col gap-4">
                        <h3 className="text-base font-semibold">{dict.common.common_questions}</h3>
                        {linkedCommonQuestionsAnswers.map((qa) => (
                            <div key={qa?.question_id}>
                                <p className="text-sm font-medium mb-2">{qa?.text}</p>
                                <div className="pl-4 border-l-2 border-muted">
                                    <p className="text-sm text-foreground">{String(qa?.answer)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {linkedRolesQuestionsAnswers.map((data) => (
                    <div key={data.id} className="flex flex-col gap-4">
                        <h3 className="text-base font-semibold">
                            {data.roleName} {dict.common.questions}
                        </h3>
                        {data.questions.map((qa) => (
                            <div key={qa?.question_id}>
                                <p className="text-sm font-medium mb-2">{qa?.text}</p>
                                <div className="pl-4 border-l-2 border-muted">
                                    <p className="text-sm text-foreground">{String(qa?.answer)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </ScrollArea>
    );
}
