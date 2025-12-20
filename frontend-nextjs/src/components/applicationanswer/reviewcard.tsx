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

export default function ReviewCard({
    questionsAndAnswers,
}: {
    questionsAndAnswers: QuestionAndAnswer[];
}) {
    const [open, setOpen] = useState(false)

    return (
        <>
        <button
            type="button"
            onClick={() => setOpen(true)}
            className="
                fixed bottom-6 right-6 z-50
                rounded-md border border-primary
                px-4 py-2
                text-primary
                transition-colors
                cursor-pointer
                hover:bg-primary hover:text-primary-foreground
                active:bg-primary active:text-primary-foreground
                focus-visible:bg-primary focus-visible:text-primary-foreground
            "

        >
            Submit Answers
        </button>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Review answers
                        </DialogTitle>
                        <DialogDescription>
                            Review your answers before submission. Unanswered required questions will block submission.
                        </DialogDescription>
                    </DialogHeader>
                    <p>
                        {JSON.stringify(questionsAndAnswers, null, 2)}
                    </p>
                </DialogContent>
            </Dialog>
        </>
    )
}