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
  dict
}: {
    question: any;
    dict: any
}){

    const [value, setValue] = useState(question.answer_id ? question.answer_id : "")
    const placeholder = dict?.placeholder ?? 'Select an option';
    const noAnswerLabel = dict?.noAnswerLabel ?? 'No Answer';
    const options: MultiOptionQuestionOption[] =
    (question as any).options ?? [];

    useEffect(() => {
        setValue(question.answer_id);
    }, [question.answer_id]);

    const handleSelect = (selectedValue: string) => {
        const originalOption = options.find(opt => opt.id.toString() === selectedValue);
        const optionId = originalOption ? originalOption.id : selectedValue;

        setValue(optionId);
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
                        {question.answer ? question.answer : ""}
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