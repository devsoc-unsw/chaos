import React, { useState, useEffect, ChangeEvent } from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AnswerValue, MultiOptionQuestionOption, Question, QuestionAndAnswer } from '@/models/question';
import { deleteAnswer } from '@/models/answer';
import { useQueryClient } from '@tanstack/react-query';

// Special value to represent "No Answer" selection
export const NO_ANSWER_VALUE = 'NO_ANSWER';

export default function Dropdown({
  question,
  applicationId,
  answerId,
  submitAnswer,
  dict,
  activeTab
}: {
  question: any;
  applicationId: string;
  answerId?: string;
  submitAnswer: (question: QuestionAndAnswer, value: AnswerValue, applicationId: string, answerId?: string) => Promise<void>;
  dict: any;
  activeTab?: string;
}) {
    const queryClient = useQueryClient();
    const noAnswerLabel = dict?.no_answer ?? 'No Answer';
    const options: MultiOptionQuestionOption[] =
    (question as any).options ?? [];

    // Derive the actual option ID from the answer text
    const getValueFromAnswer = (): string => {
        if (!question.answer || question.answer === "No Answer") {
            return NO_ANSWER_VALUE;
        }
        const matchingOption = options.find(opt => opt.text === question.answer);
        return matchingOption ? matchingOption.id.toString() : NO_ANSWER_VALUE;
    };

    const [value, setValue] = useState(getValueFromAnswer());
    const [answer, setAnswer] = useState(question.answer ? question.answer : "")
    const placeholder = question.answer ? question.answer : ""

    useEffect(() => {
        const newValue = getValueFromAnswer();
        setValue(newValue);
        setAnswer(question.answer || "");
    }, [question.answer, question.answer_id]);

    const handleSelect = async (selectedValue: string) => {
        let value = NO_ANSWER_VALUE
        let answer = ''
        if (selectedValue === NO_ANSWER_VALUE) {
            setValue(NO_ANSWER_VALUE);
            setAnswer("No Answer");
        } else {
            const option = options.find(opt => opt.id.toString() === selectedValue);
            if (!option) {
                console.error("Selected option not found:", selectedValue);
                return;
            }
            value = option.id.toString()
            answer = option.text
        }
        setValue(value);
        setAnswer(answer);
        try {
            await submitAnswer(question, value, applicationId, answerId);
        } catch (err) {
            console.error("Dropdown update failed:", err);
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