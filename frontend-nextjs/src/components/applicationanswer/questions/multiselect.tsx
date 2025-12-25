import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { AnswerValue, MultiOptionQuestionOption, QuestionAndAnswer } from '@/models/question';

// Special value to represent "No Answer" selection
export const NO_ANSWER_VALUE = '__NO_ANSWER__';

export default function MultiSelect({
    question,
    applicationId,
    answerId,
    submitAnswer,
    dict,
}: {
    question: any;
    applicationId: string;
    answerId?: string;
    submitAnswer: (question: QuestionAndAnswer, value: AnswerValue, applicationId: string, answerId?: string) => Promise<void>;
    dict: any;
}) {
    const options: MultiOptionQuestionOption[] =
        (question as any).options ?? [];

    // vibed this i cbf lowk mb lmk if I should rewrite
    function deriveIdsFromAnswerString(answerString: string, options: MultiOptionQuestionOption[]) {
        if (!answerString) return [];
            const labels = answerString
                .split(",")
                .map(s => s.trim())
                .filter(Boolean);

            return labels
                .map(label => {
                const opt = options.find(o => o.text === label);
                return opt ? String(opt.id) : null;
                })
                .filter(Boolean) as string[];
    }

    const [selectedOptions, setSelectedOptions] =
    useState<string[]>(deriveIdsFromAnswerString(question.answer, options));

    const handleChange = (optionId: string | number, checked: boolean) => {
        const id = String(optionId);

        const next = checked
            ? [...selectedOptions, id]
            : selectedOptions.filter(existingId => existingId !== id);

        setSelectedOptions(next);
        submitAnswer(question, next, applicationId, answerId);
    };

    return (
        <div className="mb-6">
        <div className="flex items-center mb-2">
            <Label className="text-lg font-medium">{question.text}</Label>
            {question.required && <span className="ml-1 text-destructive">*</span>}
        </div>

        {question.description && (
            <p className="mb-4 text-sm text-muted-foreground">{question.description}</p>
        )}

        <div className="space-y-3">
            {options.map((option) => (
                <div key={option.id} className="flex items-center space-x-2">
                    <Checkbox
                        id={`option-${question.id}-${option.id}`}
                        checked={selectedOptions.includes(option.id)}
                        onCheckedChange={(checked) => handleChange(option.id, !!checked)}
                    />
                    <Label
                        htmlFor={`option-${question.id}-${option.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                        {option.text}
                    </Label>
                </div>
            ))}
        </div>
        </div>
    );
}