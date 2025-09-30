import React from "react";
import QuestionEditor from "components/QuestionEditor/QuestionEditor";

export default function CreateQuestion() {
    return (
        <div className="h-screen w-full p-4">
            <div className="h-full max-w-4xl mx-auto">
                <QuestionEditor />
            </div>
        </div>
    );
}