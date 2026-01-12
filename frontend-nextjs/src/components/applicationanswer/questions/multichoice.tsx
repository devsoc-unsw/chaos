import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { AnswerValue, MultiOptionQuestionOption, Question, QuestionAndAnswer} from '@/models/question';

// Special value to represent "No Answer" selection
export const NO_ANSWER_VALUE = '__NO_ANSWER__';

export default function MultiChoice({
  question,
  applicationId,
  answerId,
  submitAnswer,
  dict
}: {
  question: QuestionAndAnswer;
  applicationId: string;
  answerId?: string;
  submitAnswer: (question: QuestionAndAnswer, value: AnswerValue, applicationId: string, answerId?: string) => Promise<void>;
  dict: any;
}) {
    //extract option from text
    const getOptionFromText = (question: QuestionAndAnswer): string => {
      if (!question.answer) return ""

      const option = question.options.find(o => o.text === question.answer);
      return option ? option.id : ""
    }

    const [value, setValue] = useState(getOptionFromText(question))
    const options: MultiOptionQuestionOption[] = question.options ?? [];

    useEffect(() => {
        setValue(getOptionFromText(question));
    }, [question.answer])

    const handleChange = async (value: string) => {
        setValue(value);
        try {
            await submitAnswer(question, value, applicationId, answerId)
        } catch (err) {
            console.error("Short answer update failed:", err);
        }
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
                value={option.id}
                id={`option-${question.question_id}-${option.id}`}
              />
              <Label
                htmlFor={`option-${question.question_id}-${option.id}`}
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