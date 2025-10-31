import { createReactBlockSpec } from "@blocknote/react";
import React from "react";
import { useQuestionSave } from "../QuestionSaveContext";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";

type Option = {
    text: string;
    correct: boolean;
};


// Multiple Choice Question Block
export const mcqQuestionBlock = createReactBlockSpec(
    {
        type: "mcqQuestion",
        propSchema: {
            question: { default: "" },
            description: { default: "" },
            options: { default: JSON.stringify([{ text: "Option 1", correct: false }]) },
            questionId: { default: "" }, // Database ID for existing questions
            originalCommon: { default: false }, // Original common status
            originalRoles: { default: JSON.stringify([]) }, // Original roles array
        },
        content: "none",
    },
    {
        render: (props) => {
            const { block, editor } = props;
            const { onSaveQuestion, onDeleteQuestion, isSaving, savingBlockId } = useQuestionSave();
            const isExistingQuestion = !!(block.props.questionId as string);
            const isSavingThis = savingBlockId === block.id;
            const options: Option[] = JSON.parse(block.props.options);

            const updateQuestion = (newQuestion: string) => {
                editor.updateBlock(block, {
                    props: { ...block.props, question: newQuestion },
                });
            };

            const updateDescription = (newDescription: string) => {
                editor.updateBlock(block, {
                    props: { ...block.props, description: newDescription },
                });
            };

            const updateOption = (index: number, key: keyof Option, value: string | boolean) => {
                const newOptions = [...options];
                (newOptions[index] as any)[key] = value;
                editor.updateBlock(block, {
                    props: { ...block.props, options: JSON.stringify(newOptions) },
                });
            };

            const addOption = () => {
                const newOptions = [...options, { text: "", correct: false }];
                editor.updateBlock(block, {
                    props: { ...block.props, options: JSON.stringify(newOptions) },
                });
            };

            const handleOptionFocus = (index: number, currentValue: string) => {
                // Clear placeholder-like text when user focuses
                if (currentValue && currentValue.match(/^Option \d+$/)) {
                    updateOption(index, "text", "");
                }
            };

            const removeOption = (index: number) => {
                if (options.length > 1) {
                    const newOptions = options.filter((_, i) => i !== index);
                    editor.updateBlock(block, {
                        props: { ...block.props, options: JSON.stringify(newOptions) },
                    });
                }
            };

            return (
                <div className="border border-gray-300 rounded-md p-3 bg-white shadow-sm w-full">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Multiple Choice</span>
                    </div>
                    <input
                        type="text"
                        value={block.props.question || ""}
                        onChange={(e) => updateQuestion(e.target.value)}
                        onFocus={(e) => {
                            const val = e.target.value;
                            if (val && (val.includes("Enter your") || val.includes("question..."))) {
                                updateQuestion("");
                            }
                        }}
                        className="w-full text-base font-medium border border-gray-400 bg-gray-50 p-2 rounded mb-3 text-black"
                        placeholder="Enter your question..."
                    />

                    <textarea
                        value={block.props.description || ""}
                        onChange={(e) => updateDescription(e.target.value)}
                        className="w-full text-sm border border-gray-300 bg-gray-50 p-2 rounded mb-3 text-gray-600 resize-none"
                        placeholder="Add a description (optional)..."
                        rows={2}
                    />

                    <div className="space-y-2">
                        {options.map((option, index) => (
                            <div key={index} className="flex items-center gap-2">
                                {/* Correct Answer Radio Button (Single Choice) */}
                                <input
                                    type="radio"
                                    name={`mcq-${block.id}`}
                                    checked={option.correct}
                                    onChange={(e) => {
                                        // For MCQ, only one option can be correct
                                        const newOptions = options.map((opt, i) => ({
                                            ...opt,
                                            correct: i === index ? e.target.checked : false
                                        }));
                                        editor.updateBlock(block, {
                                            props: { ...block.props, options: JSON.stringify(newOptions) },
                                        });
                                    }}
                                    className="h-4 w-4 text-blue-600"
                                />

                                {/* Option Text */}
                                <input
                                    type="text"
                                    value={option.text}
                                    onChange={(e) => updateOption(index, "text", e.target.value)}
                                    onFocus={(e) => handleOptionFocus(index, e.target.value)}
                                    className="flex-1 border-none outline-none bg-gray-50 p-2 rounded text-black"
                                    placeholder={`Option ${index + 1}`}
                                />

                                {/* Delete Option */}
                                {options.length > 1 && (
                                    <button
                                        onClick={() => removeOption(index)}
                                        className="text-red-500 hover:text-red-700"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        ))}

                        {/* Add Option */}
                        <button
                            onClick={addOption}
                            className="w-full text-blue-600 hover:text-blue-800 border border-dashed border-blue-300 p-2 rounded"
                        >
                            + Add Option
                        </button>
                    </div>

                    {/* Save/Edit Button and Delete Menu */}
                    <div className="mt-4 flex justify-end items-center gap-2">
                        {isExistingQuestion && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <MoreVertical className="h-5 w-5 text-gray-600" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                        onClick={() => void onDeleteQuestion(block)}
                                        className="text-red-600 focus:text-red-600 focus:bg-red-50"
                                    >
                                        Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                        <button
                            onClick={() => void onSaveQuestion(block)}
                            disabled={isSavingThis || !block.props.question}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSavingThis ? "Saving..." : isExistingQuestion ? "Edit Question" : "Create Question"}
                        </button>
                    </div>
                </div>
            );
        },
    }
);







