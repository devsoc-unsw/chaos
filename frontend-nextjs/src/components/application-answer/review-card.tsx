import { QuestionAndAnswer } from "@/models/question";
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { useState } from "react";
import { CampaignRole, RoleDetails } from "@/models/campaign";
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from "../ui/tooltip";
export default function ReviewCard({
    questionsAndAnswersByRole,
    applicationId,
    selectedRoleIds,
    handleSubmit,
    roles,
    dict
}: {
    questionsAndAnswersByRole: Map<string, QuestionAndAnswer[]>;
    applicationId: string;
    selectedRoleIds: string[];
    handleSubmit: () => void;
    roles: RoleDetails[] | undefined;
    dict: any;
}) {
    const [open, setOpen] = useState(false)

    // vibed this
    const requiredUnanswered = Array.from(
        questionsAndAnswersByRole.values()
    )
        .flat()
        .some((qa) => {
            if (!qa) return false;
            if (!qa.required) return false;

            if (qa.answer == null) return true;
            if (qa.answer === "No Answer") return true;
            if (qa.answer === "__NO_ANSWER__") return true;

            if (typeof qa.answer === "string") {
                return qa.answer.trim() === "";
            }

            if (Array.isArray(qa.answer)) {
                return qa.answer.length === 0;
            }

            return false;
        });

    function renderAnswerPreview(qa: QuestionAndAnswer): string {
        if (!qa.answer || qa.answer === "__NO_ANSWER__") {
            return "No answer";
        }

        switch (qa.question_type) {
            case "ShortAnswer":
                return String(qa.answer);

            case "DropDown":
            case "MultiChoice": {
                const option = qa.options.find(o => o.id === qa.answer);
                return option ? option.text : String(qa.answer);
            }

            case "MultiSelect":
                //ts so cooked, it expects string from backend but frontend needs conversions ;-;
                if (typeof qa.answer === "string") {
                    return qa.answer === "No Answer" ? "No Answer" : qa.answer;
                }
                if (!Array.isArray(qa.answer) || qa.answer.length === 0) {
                    return "No Answer";
                }
                return qa.answer
                    .map(id => {
                        const opt = qa.options.find(o => o.id === id);
                        return opt ? opt.text : String(id);
                    })
                    .join(", ");

            case "Ranking":
                // Unanswered ranking is the string "No Answer" from processAnswerForDisplay
                if (
                    !qa.answer ||
                    qa.answer === "No Answer" ||
                    qa.answer === "__NO_ANSWER__"
                ) {
                    return "No Answer";
                }
                // vibed this too cause lowk didn't know how to map it in the best way
                // Backend always returns rankings in string form, so we have to split it up to render nicely
                if (qa.answer === "No Answer") {
                    return "No Answer";
                }

                if (
                    typeof qa.answer === "string" &&
                    /^\s*\d+\.\s+/.test(qa.answer)
                ) {
                    return qa.answer;
                }

                let ids: string[] = [];
                if (Array.isArray(qa.answer)) {
                    ids = qa.answer.map(String);
                } else if (typeof qa.answer === "string") {
                    ids = qa.answer
                        .replace(/^\[|\]$/g, "")
                        .split(",")
                        .map(s => s.trim())
                        .filter(Boolean);
                }

                const ranked = ids.map((id, index) => {
                    const option = qa.options.find(o => String(o.id) === id);
                    const text = option?.text ?? id;
                    return `${index + 1}. ${text}`;
                });

                return ranked.join(", ");

            default:
                return String(qa.answer);
        }
    }

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="fixed bottom-4 left-4 right-4 z-50 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-center text-sm font-semibold text-primary-foreground shadow-[0_10px_30px_-12px_hsl(var(--primary))] transition-all hover:-translate-y-0.5 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:translate-y-0 active:brightness-100 sm:bottom-6 sm:left-auto sm:right-6 sm:w-auto sm:px-5"
            >
                {dict.applicationpage.submit_answers}
            </button>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="flex max-h-[85vh] w-[95vw] max-w-3xl flex-col overflow-y-auto sm:w-[92vw]">
                    <div className="sticky top-0 z-10 bg-background">
                        <DialogHeader>
                            <DialogTitle>
                                {dict.applicationpage.review_answers}
                            </DialogTitle>
                            <DialogDescription>
                                {dict.applicationpage.review_answers_desc}
                            </DialogDescription>
                        </DialogHeader>
                    </div>
                    <div className="flex-1 overflow-y-auto px-1 pb-4 pt-4 sm:px-2 sm:pb-6">
                        {questionsAndAnswersByRole.has('general') && (
                            (() => {
                                const qas = questionsAndAnswersByRole.get('general');
                                const role = roles?.find(r => String(r.id) === String('general'));
                                return (
                                    <div key="general" className="mb-6">
                                        <h3 className="text-lg font-bold sm:text-xl">
                                            General
                                        </h3>
                                        {!qas || qas.length === 0 ? (
                                            <p>General has no questions</p>
                                        ) : (
                                            qas.map(qa => {
                                                const answer = renderAnswerPreview(qa)
                                                return (
                                                    <div key={qa.question_id} className="mb-2">
                                                        <div className="flex items-start gap-1">
                                                            <h4 className="text-sm font-semibold sm:text-base">{qa.text}</h4>
                                                            {qa.required && (
                                                                <div className="text-destructive font-bold">*</div>
                                                            )}
                                                        </div>
                                                        <div className="mt-2 overflow-x-auto rounded bg-muted p-3 text-sm">
                                                            {answer}
                                                        </div>
                                                    </div>
                                                )
                                            })
                                        )}
                                    </div>
                                );
                            })()
                        )}

                        {selectedRoleIds.map(roleId => {
                            if (roleId === 'general') return null;

                            const qas = questionsAndAnswersByRole.get(roleId);
                            const role = roles?.find(r => String(r.id) === String(roleId));

                            return (
                                <div key={roleId} className="mb-6">
                                    <h3 className="text-lg font-bold sm:text-xl">
                                        {role?.name ?? `Role ${roleId}`}
                                    </h3>
                                    {!qas || qas.length === 0 ? (
                                        <p>This role has no questions</p>
                                    ) : (
                                        qas.map(qa => {
                                            const answer = renderAnswerPreview(qa)
                                            return (
                                                <div key={qa.question_id} className="mb-2">
                                                    <div className="flex items-start gap-1">
                                                        <h4 className="text-sm font-semibold sm:text-base">{qa.text}</h4>
                                                        {qa.required && (
                                                            <div className="text-destructive font-bold">*</div>
                                                        )}
                                                    </div>
                                                    <div className="mt-2 overflow-x-auto rounded bg-muted p-3 text-sm">
                                                        {answer}
                                                    </div>
                                                </div>
                                            )
                                        })
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    <div className="sticky bottom-0 z-10 border-t bg-background p-4">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span className="inline-block w-full">
                                        <Button
                                            className="w-full rounded-lg border border-primary bg-primary text-primary-foreground transition-all hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 active:brightness-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                            type="button"
                                            disabled={requiredUnanswered}
                                            onClick={() => handleSubmit()}
                                        >
                                            {dict.applicationpage.submit_application}
                                        </Button>
                                    </span>
                                </TooltipTrigger>

                                {requiredUnanswered && (
                                    <TooltipContent>
                                        {dict.applicationpage.submit_application_tooltip}
                                    </TooltipContent>
                                )}
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}