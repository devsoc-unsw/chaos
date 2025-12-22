import React, { useState, useEffect, ChangeEvent } from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MultiOptionQuestionOption, Question } from '@/models/question';

// Special value to represent "No Answer" selection
export const NO_ANSWER_VALUE = '__NO_ANSWER__';

export default function Dropdown({
  question,
  applicationId,
  answerId,
  submitAnswer,
  dict
}: {
  question: any;
  applicationId: string;
  answerId?: string;
  submitAnswer: (
    question: any,
    value: any,
    applicationId: string,
    answerId?: string
  ) => Promise<void>;
  dict: any;
}) {
    const [value, setValue] = useState(question.answer_id ? question.answer_id : "")
    const [answer, setAnswer] = useState(question.answer ? question.answer : "")
    const placeholder = question.answer ? question.answer : ""
    const noAnswerLabel = dict?.noAnswerLabel ?? 'No Answer';
    const options: MultiOptionQuestionOption[] =
    (question as any).options ?? [];

    useEffect(() => {
        setValue(question.answer_id);
    }, [question.answer_id]);

    const handleSelect = async (selectedValue: string) => {
        const option = options.find(opt => opt.id.toString() === selectedValue);
        const optionId = option ? option.id : selectedValue;
        const optionText = option ? option.text : "";

        setValue(optionId);
        setAnswer(optionText);
        // this breaks the code. Will explain more later.
        // if (selectedValue === NO_ANSWER_VALUE) {
        //     setAnswer("");
        //     try {
        //         await submitAnswer(question, "0", applicationId, answerId);
        //     } catch (err) {
        //         console.error("Dropdown update failed:", err);
        //     }
        //     return;
        // }
        try {
            await submitAnswer(question, optionId, applicationId, answerId)
        } catch (err) {
            console.error("Short answer update failed:", err);
        }
    };

    return (
        <div className="mb-6 w-full max-w-sm">
            <div className="mb-4 flex">
                <Label>{question.text}</Label>
                {question.required && <span className="ml-1 text-destructive">*</span>}
            </div>
            <Select
                key={options.length + '-' + value}
                value={value}
                onValueChange={handleSelect}
            >
                <SelectTrigger>
                    <SelectValue placeholder={placeholder}>
                        {answer}
                    </SelectValue>
                </SelectTrigger>
                <SelectContent>
                    <SelectItem
                        key={NO_ANSWER_VALUE}
                        value={NO_ANSWER_VALUE}
                    >
                        {noAnswerLabel}
                    </SelectItem>
                    {options.map((option) => (
                        <SelectItem
                        key={option.id}
                        value={option.id.toString()}
                        >
                        {option.text}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}