import { useState, useEffect, ChangeEvent } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AnswerValue, QuestionAndAnswer } from '@/models/question';

export default function ShortAnswer({
    question,
    applicationId,
    answerId,
    submitAnswer,
    dict
}: {
    question: any;
    applicationId: string;
    answerId?: string;
    submitAnswer: (question: QuestionAndAnswer, value: AnswerValue, applicationId: string, answerId?: string) => Promise<void>;
    dict: any;
}) {
    const [value, setValue] = useState(question.answer);
    const [previousAnswer, setPreviousAnswer] = useState(question.answer === "No Answer" ? null : question.answer)

    useEffect(() => {
        if (question.answer === 'No Answer') {
            setValue('')
            setPreviousAnswer(null)
        } else {
            setValue(question.answer);
            setPreviousAnswer(question.answer);
        }
    }, [question.answer, question.answer_id]);

    const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
        setValue(e.target.value);
    }

    const handleBlur = async () => {
        const trimmed = value.trim() === '' ? '' : value.trim()
        const trimmedPrev = previousAnswer?.trim() === '' ? '' : previousAnswer?.trim()
        if (trimmed === trimmedPrev) {
            return
        }

        try {
            await submitAnswer(question, value, applicationId, answerId)
            setPreviousAnswer(trimmedPrev || null)
        } catch (err) {
            console.error("Short answer update failed:", err);
        }
    };

    //write onsubmit
    return (
        <div className="mb-6 w-full">
            <div className="mb-2 flex">
                <Label>{question.text}</Label>
                {question.required && <span className="ml-1 text-destructive">*</span>}
            </div>
            {question.description && (
                <p className="mb-4 text-sm text-muted-foreground">{question.description}</p>
            )}
            <Textarea
                value={value}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder={question ? dict.applicationpage.youranswer : "Your answer"}
                className={`w-full resize-y transition-all duration-200 hover:border-primary focus:border-primary max-w-4xl`}
            />
        </div>
    )
}