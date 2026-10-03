"use client";

import { useQuery } from "@tanstack/react-query";
import { getApplication } from "@/models/application";
import { getApplicationQuestionsAnswers, linkQuestionsAndAnswers } from "@/models/question";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function ApplicationDetailsComponent({
    applicationId,
    dict,
    selectedRoleId,
}: {
    applicationId: string;
    dict: any;
    selectedRoleId?: string | null;
}) {
    const { data: application } = useQuery({
        queryKey: [`${applicationId}-application-details`],
        queryFn: () => getApplication(applicationId),
        enabled: !!applicationId,
    });

    const { data: qaData } = useQuery({
        queryKey: [`${applicationId}-questions-answers`],
        queryFn: () => getApplicationQuestionsAnswers(applicationId),
        enabled: !!applicationId,
    });

    const linkedCommonQuestionsAnswers = linkQuestionsAndAnswers(
        (qaData ?? []).filter((q) => q.common)
    );

    const roles = application?.applied_roles ?? [];

    const linkedRolesQuestionsAnswers = roles
        .map((role) => ({
            id: role.campaign_role_id,
            roleName: role.role_name,
            questions: linkQuestionsAndAnswers(
                (qaData ?? []).filter((q) => !q.common && q.roles.includes(role.campaign_role_id))
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
