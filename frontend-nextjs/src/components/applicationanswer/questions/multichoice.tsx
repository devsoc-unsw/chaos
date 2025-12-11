import React, { useState, useEffect, ChangeEvent } from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { MultiOptionQuestionOption} from '@/models/question';

// Special value to represent "No Answer" selection
export const NO_ANSWER_VALUE = '__NO_ANSWER__';

export default function Multichoice({
  question,
  dict
}: {
    question: any;
    dict: any
}){
    const [value, setValue] = useState(question.answer_id ? question.answer_id : "")
    const options: MultiOptionQuestionOption[] =
    (question as any).options ?? [];

    useEffect(() => {
        setValue(question.answer_id);
    }, [question.answer_id])

    const handleChange = (value: string) => {
        const optionValue = options.find(opt => opt.id.toString() === value);
        const optionId = optionValue ? optionValue.id : value;
        setValue(optionId);
    }

    return (
    <div className="mb-6">
    <div className="flex items-center mb-2">
        <Label className='text-foreground'>{question.text}</Label>
        {question.required && <span className="ml-1 text-destructive">*</span>}
    </div>

      {question.description && (
        <p className="mb-4 text-sm text-muted-foreground">{question.description}</p>
      )}

      <RadioGroup
        value={value}
        onValueChange={handleChange}
      >
        {options.map((option) => (
          <div key={option.id} className="flex items-center space-x-2">
            <RadioGroupItem
              value={option.id.toString()}
              id={`option-${question.id}-${option.id}`}
            />
            <Label
              htmlFor={`option-${question.id}-${option.id}`}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {option.text}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
    );
}