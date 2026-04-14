import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { AnswerValue, MultiOptionQuestionOption, QuestionAndAnswer } from '@/models/question';

// Special value to represent "No Answer" selection
export const NO_ANSWER_VALUE = 'NO_ANSWER';

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
    submitAnswer: (question: QuestionAndAnswer, value: AnswerValue, applicationId: string, answerId?: string) => Promise<void>;
    dict: any;
    activeTab?: string;
}) {
    const noAnswerLabel = dict?.no_answer ?? 'No Answer';
    const options: MultiOptionQuestionOption[] =
        (question as any).options ?? [];

    const getValueAndAnswer = (): { value: string; answer: string } => {
        if (!question.answer || question.answer === "No Answer") {
            return { value: NO_ANSWER_VALUE, answer: "" };
        }
        const textAnswer = options.find(opt => opt.text === question.answer);
        const idAnswer = options.find(opt => opt.id.toString() === String(question.answer));
        const match = textAnswer ?? idAnswer;
        return match ? { value: match.id.toString(), answer: match.text } : { value: NO_ANSWER_VALUE, answer: "" };
    };

    const initial = getValueAndAnswer();
    const [value, setValue] = useState(initial.value);
    const [answer, setAnswer] = useState(initial.answer);
    const placeholder = initial.answer || ""

    useEffect(() => {
        const { value: v, answer: a } = getValueAndAnswer();
        setValue(v);
        setAnswer(a);
    }, [question.answer, question.answer_id]);

    const handleSelect = async (selectedValue: string) => {
        let value = NO_ANSWER_VALUE
        let answer = ''
        if (selectedValue === NO_ANSWER_VALUE) {
            setValue(NO_ANSWER_VALUE);
            setAnswer("No Answer");
            try {
                await submitAnswer(question, value, applicationId, answerId);
            } catch (err) {
                console.error("Submit failed:", err);
            }
            return
        }

        const option = options.find(opt => opt.id.toString() === selectedValue);
        if (!option) {
            console.error("option not found:", selectedValue);
            return;
        }
        value = option.id.toString()
        answer = option.text
        setValue(value);
        setAnswer(answer);
        try {
            await submitAnswer(question, value, applicationId, answerId);
        } catch (err) {
            console.error("Submit failed:", err);
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