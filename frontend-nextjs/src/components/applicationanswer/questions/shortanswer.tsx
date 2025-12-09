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
    return (
        <div className="mb-6 w-full">
            <div className="mb-4 flex">
                <Label>{question.text}</Label>
                {question.required && <span className="ml-1 text-red-500">*</span>}
            </div>
            <Textarea
                placeholder={dict ? dict.applicationpage.youranswer : "Your answer"} 
                className={`w-full resize-y transition-all duration-200 hover:border-blue-400 focus:border-blue-500 max-w-4xl`}
            />
        </div>
    )
}