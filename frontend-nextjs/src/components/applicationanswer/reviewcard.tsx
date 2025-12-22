import { QuestionAndAnswer } from "@/models/question";
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react";
import { CampaignRole } from "@/models/campaign";
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { submitApplication } from "@/models/application";
export default function ReviewCard({
    questionsAndAnswersByRole,
    applicationId,
    roles
}: {
    questionsAndAnswersByRole: Map<string, QuestionAndAnswer[]>;
    applicationId: string;
    roles: CampaignRole[] | undefined;
}) {
    const [open, setOpen] = useState(false)
    const requiredUnanswered = Array.from(
        questionsAndAnswersByRole.values()
    )
    .flat()
    .some((qa) => {
        if (!qa.required) return false;

        if (qa.answer == null) return true;
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
            return "[No Answer Provided]";
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
                return Array.isArray(qa.answer)
                    ? qa.answer
                        .map(id => {
                        const opt = qa.options.find(o => o.id === id);
                        return opt ? opt.text : String(id);
                        })
                        .join(", ")
                    : String(qa.answer);

            case "Ranking":
                // vibed this too cause lowk didn't know how to map it in the best way
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

    const handleSubmit = async () => {
        submitApplication(applicationId)
    }

    return (
        <>
        <button
            type="button"
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-50 rounded-md border border-primary px-4 py-2 text-primary transition-colors cursor-pointer hover:bg-primary hover:text-primary-foreground active:bg-primary active:text-primary-foreground focus-visible:bg-primary focus-visible:text-primary-foreground"
        >
            Submit Answers
        </button>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="!max-w-none !w-[40vw] max-h-[80vh] overflow-y-auto flex flex-col">
                   <div className="sticky top-0 z-10 bg-background">
                        <DialogHeader>
                            <DialogTitle>
                                Review answers
                            </DialogTitle>
                            <DialogDescription>
                                Review your answers before submission. Unanswered required questions will block submission.
                            </DialogDescription>
                        </DialogHeader>
                    </div>
                    <div className="flex-1 overflow-y-auto px-6 pb-6 pt6">
                        {/* should probably refactor to avoid the hadouken */}
                        {Array.from(questionsAndAnswersByRole.entries()).map(
                            ([roleId, qas]) => {
                                const role = roles?.find(r => String(r.id) === String(roleId));
                                return (
                                    <div key={roleId} className="mb-6">
                                        <h3 className="text-xl font-bold">
                                            {role?.name ?? "General"}
                                        </h3>
                                        {
                                            qas.map(qa => {
                                                const answer = renderAnswerPreview(qa)
                                                return (
                                                    <div key={qa.question_id} className="mb-2">
                                                        <div className="flex">
                                                            <h4 className="text-l font-semibold">{qa.text}</h4>
                                                            {qa.required && (
                                                                <div className="text-destructive font-bold">*</div>
                                                                )
                                                            }
                                                        </div>
                                                        <div className="mt-2 rounded bg-muted p-3 text-sm overflow-x-auto">
                                                            {answer}
                                                        </div>
                                                    </div>
                                                )
                                            })
                                        }
                                    </div>
                                );
                            }
                        )}
                    </div>
                    <div className="sticky bottom-0 z-10 bg-background border-t p-4">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span className="inline-block w-full">
                                    <Button
                                        className="w-full bg-background text-primary border border-primary transition-colors cursor-pointer hover:bg-primary hover:text-primary-foreground active:bg-primary active:text-primary-foreground focus-visible:bg-primary focus-visible:text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                                        type="button"
                                        disabled={requiredUnanswered}
                                        onClick={() => handleSubmit()}
                                    >
                                        Submit Application
                                    </Button>
                                    </span>
                                </TooltipTrigger>

                                {requiredUnanswered && (
                                    <TooltipContent>
                                    Please answer all required questions before submitting.
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