import React, { useState, useEffect, ChangeEvent } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Question } from '@/models/question';

export default function ShortAnswer({
  question,
  dict
}: {
    question: any;
    dict: any
}){
    const [value, setValue] = useState(question.answer);
    useEffect(() => {
        setValue(question.answer);
    }, [question.answer]);

    const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
        setValue(e.target.value);
        console.log(value)
    }

    const handleBlur = () => {
        console.log("SENT: ", value);
    }
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