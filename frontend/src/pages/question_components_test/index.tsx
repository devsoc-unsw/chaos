import React, { useState } from "react";
import "twin.macro";
import Card from "components/Card";

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
    <div tw="container mx-auto py-8 px-4">
      <h1 tw="text-3xl font-bold mb-6">Question Component Types Test</h1>

      <Card tw="mb-8">
        <h2 tw="text-2xl font-medium mb-4">Short Answer</h2>
        <ShortAnswer
          id={1}
          question="What is your name?"
          description="Please enter your full name"
          required={true}
          defaultValue={answers[1] || ""}
          onSubmit={handleAnswerSubmit}
        />
      </Card>

      <Card tw="mb-8">
        <h2 tw="text-2xl font-medium mb-4">Dropdown</h2>
        <Dropdown
          id={2}
          question="What is your preferred programming language?"
          description="Select one option from the dropdown"
          options={sampleOptions}
          required={true}
          defaultValue={answers[2]}
          onSubmit={handleAnswerSubmit}
        />
      </Card>

      <Card tw="mb-8">
        <h2 tw="text-2xl font-medium mb-4">Multi Choice (Radio Buttons)</h2>
        <MultiChoice
          id={3}
          question="Which team are you most interested in?"
          description="Select one option"
          options={sampleOptions}
          required={true}
          defaultValue={answers[3]}
          onSubmit={handleAnswerSubmit}
        />
      </Card>

      <Card tw="mb-8">
        <h2 tw="text-2xl font-medium mb-4">Multi Select (Checkboxes)</h2>
        <MultiSelect
          id={4}
          question="Which technologies are you familiar with?"
          description="Select all that apply"
          options={sampleOptions}
          required={true}
          defaultValue={answers[4] || []}
          onSubmit={handleAnswerSubmit}
        />
      </Card>

      <Card tw="mb-8">
        <h2 tw="text-2xl font-medium mb-4">Ranking</h2>
        <Ranking
          id={5}
          question="Rank your preference for the following roles"
          description="Click up/down arrows to reorder by preference"
          options={sampleOptions}
          required={true}
          defaultValue={answers[5] || []}
          onSubmit={handleAnswerSubmit}
        />
      </Card>

      <Card>
        <h2 tw="text-2xl font-medium mb-4">Current Answers Log</h2>
        <pre tw="bg-gray-100 p-4 rounded overflow-auto">
          {JSON.stringify(answers, null, 2)}
        </pre>
      </Card>
    </div>
  );
};

export default QuestionComponentsTestPage;