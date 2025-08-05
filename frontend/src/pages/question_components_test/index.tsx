import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Import question components
import ShortAnswer from "components/QuestionComponents/ShortAnswer";
import Dropdown from "components/QuestionComponents/Dropdown";
import MultiChoice from "components/QuestionComponents/MultiChoice";
import MultiSelect from "components/QuestionComponents/MultiSelect";
import Ranking from "components/QuestionComponents/Ranking";

const QuestionComponentsTestPage: React.FC = () => {
  // State to store answers
  const [answers, setAnswers] = useState<{ [key: number]: any }>({});

  // Handler for answer submission
  const handleAnswerSubmit = (questionId: number, value: any) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
    console.log(`Question ${questionId} answered:`, value);
  };

  // Sample options for select-type questions
  const sampleOptions = [
    { id: 1, label: "Option 1" },
    { id: 2, label: "Option 2" },
    { id: 3, label: "Option 3" },
    { id: 4, label: "Option 4" },
  ];

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Question Component Types Test</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Short Answer</CardTitle>
        </CardHeader>
        <CardContent>
          <ShortAnswer
            id={1}
            question="What is your name?"
            description="Please enter your full name"
            required={true}
            defaultValue={answers[1] || ""}
            onSubmit={handleAnswerSubmit}
          />
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Dropdown</CardTitle>
        </CardHeader>
        <CardContent>
          <Dropdown
            id={2}
            question="What is your preferred programming language?"
            description="Select one option from the dropdown"
            options={sampleOptions}
            required={true}
            defaultValue={answers[2]}
            onSubmit={handleAnswerSubmit}
          />
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Multi Choice (Radio Buttons)</CardTitle>
        </CardHeader>
        <CardContent>
          <MultiChoice
            id={3}
            question="Which team are you most interested in?"
            description="Select one option"
            options={sampleOptions}
            required={true}
            defaultValue={answers[3]}
            onSubmit={handleAnswerSubmit}
          />
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Multi Select (Checkboxes)</CardTitle>
        </CardHeader>
        <CardContent>
          <MultiSelect
            id={4}
            question="Which technologies are you familiar with?"
            description="Select all that apply"
            options={sampleOptions}
            required={true}
            defaultValue={answers[4] || []}
            onSubmit={handleAnswerSubmit}
          />
        </CardContent>
      </Card>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Ranking</CardTitle>
        </CardHeader>
        <CardContent>
          <Ranking
            id={5}
            question="Rank your preference for the following options"
            description="Drag and drop options to your preferences"
            options={sampleOptions}
            required={true}
            defaultValue={answers[5] || []}
            onSubmit={handleAnswerSubmit}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Answers Log</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
            {JSON.stringify(answers, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuestionComponentsTestPage;