import React, { useEffect, useMemo, useRef, useState } from "react";
import { createReactBlockSpec } from "@blocknote/react";
import type { Block } from "@blocknote/core";
import { useQuestionSave } from "../QuestionSaveContext";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Option = {
    text: string;
    correct: boolean;
};

// Dropdown Question Block
export const dropDownQuestionBlock = createReactBlockSpec(
    {
        type: "dropDownQuestion",
        propSchema: {
            question: { default: "" },
            description: { default: "" },
            options: { default: JSON.stringify([{ text: "Option 1", correct: false }]) },
            questionId: { default: "" }, 
            common: { default: false }, 
            roles: { default: JSON.stringify([]) },
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
            const [selectedValue, setSelectedValue] = useState("");
            const [showDeleteDialog, setShowDeleteDialog] = useState(false);

            // Track original snapshot to detect changes for existing questions
            const initialSnapshotRef = useRef<string | null>(null);
            const currentSnapshot = useMemo(() => {
                const normalizedOptions = options.map((o) => ({ text: (o.text || "").trim(), correct: !!o.correct }));
                return JSON.stringify({
                    question: (block.props.question as string) || "",
                    description: (block.props.description as string) || "",
                    options: normalizedOptions,
                });
            }, [block.props.description, block.props.question, options]);
            if (initialSnapshotRef.current === null && isExistingQuestion) {
                initialSnapshotRef.current = currentSnapshot;
            }
            const isDirty = isExistingQuestion ? initialSnapshotRef.current !== currentSnapshot : true;

            // After this block finishes saving, reset snapshot so button locks out
            const lastSavingThisRef = useRef(false);
            useEffect(() => {
                if (lastSavingThisRef.current && !isSavingThis) {
                    if (isExistingQuestion) {
                        initialSnapshotRef.current = currentSnapshot;
                    }
                }
                lastSavingThisRef.current = isSavingThis;
            }, [isSavingThis, isExistingQuestion, currentSnapshot]);

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

            const handleDeleteClick = () => {
                if (isExistingQuestion) {
                    // Show confirmation dialog for existing questions
                    setShowDeleteDialog(true);
                } else {
                    // Directly delete uncreated questions
                    editor.removeBlocks([block]);
                }
            };

            const handleConfirmDelete = () => {
                setShowDeleteDialog(false);
                if (onDeleteQuestion) {
                    void onDeleteQuestion(block as unknown as Block);
                }
            };

            return (
                <div className="border border-gray-300 rounded-md p-3 bg-white shadow-sm w-full">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">Dropdown</span>
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

                    {/* Dropdown with Shadcn UI Select */}
                    <div className="relative z-50 mb-3">
                        <Select value={selectedValue} onValueChange={setSelectedValue}>
                            <SelectTrigger className="w-full border-purple-300 hover:border-purple-400 focus:border-purple-500 focus:ring-purple-200">
                                <SelectValue placeholder="Select an option..." />
                            </SelectTrigger>
                            <SelectContent className="z-[60]">
                                {options
                                    .filter((opt) => opt.text && opt.text.trim() !== "")
                                    .map((option, index) => (
                                        <SelectItem key={index} value={option.text || `option-${index}`}>
                                            {option.text}
                                            {option.correct && (
                                                <span className="ml-2 text-green-600 text-xs">✓ Correct</span>
                                            )}
                                        </SelectItem>
                                    ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2 relative z-0">
                        {options.map((option, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    name={`dropdown-${block.id}`}
                                    checked={option.correct}
                                    onChange={(e) => {
                                        const newOptions = options.map((opt, i) => ({
                                            ...opt,
                                            correct: i === index ? e.target.checked : false
                                        }));
                                        editor.updateBlock(block, {
                                            props: { ...block.props, options: JSON.stringify(newOptions) },
                                        });
                                    }}
                                    className="h-4 w-4 text-purple-600"
                                />
                                <input
                                    type="text"
                                    value={option.text}
                                    onChange={(e) => updateOption(index, "text", e.target.value)}
                                    onFocus={(e) => handleOptionFocus(index, e.target.value)}
                                    className="flex-1 border-none outline-none bg-gray-50 p-2 rounded text-black"
                                    placeholder={`Option ${index + 1}`}
                                />
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
                        <button
                            onClick={addOption}
                            className="w-full text-purple-600 hover:text-purple-800 border border-dashed border-purple-300 p-2 rounded"
                        >
                            + Add Option
                        </button>
                    </div>

                    {/* Save/Edit Button */}
                    <div className="mt-4 flex justify-end items-center gap-2">
                        <button
                            onClick={() => void onSaveQuestion?.(block as unknown as Block)}
                            disabled={isSavingThis || !block.props.question || (isExistingQuestion && !isDirty)}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSavingThis ? "Saving..." : isExistingQuestion ? "Edit Question" : "Create Question"}
                        </button>
                    </div>

                    {/* Delete Confirmation Dialog */}
                    <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Delete Question</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Are you sure you want to delete this question? This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handleConfirmDelete}
                                    className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                                >
                                    Delete
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            );
        },
    }
);
