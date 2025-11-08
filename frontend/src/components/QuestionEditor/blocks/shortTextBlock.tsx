import { createReactBlockSpec } from "@blocknote/react";
import type { Block } from "@blocknote/core";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useQuestionSave } from "@/components/QuestionEditor/QuestionSaveContext";
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



export const shortTextBlock = createReactBlockSpec(
    {
        type: "textQuestion",
        propSchema: {
            question: { default: "" },
            description: { default: "" },
            placeholder: { default: "" },
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
            const [showDeleteDialog, setShowDeleteDialog] = useState(false);

            // Track previous answer info to current answer info to detect changes for edit button lockout
            const initialAnswerInfo = useRef<string | null>(null);
            const currentAnswerInfo = useMemo(() => {
                return JSON.stringify({
                    question: (block.props.question as string) || "",
                    description: (block.props.description as string) || "",
                    placeholder: (block.props.placeholder as string) || "",
                });
            }, [block.props.description, block.props.placeholder, block.props.question]);
            if (initialAnswerInfo.current === null && isExistingQuestion) {
                initialAnswerInfo.current = currentAnswerInfo;
            }
            const isDirty = isExistingQuestion ? initialAnswerInfo.current !== currentAnswerInfo : true;

            // After update, then it will make the "edit" button accessible
            const lastSavingThisRef = useRef(false);
            useEffect(() => {
                if (lastSavingThisRef.current && !isSavingThis) {
                    if (isExistingQuestion) {
                        initialAnswerInfo.current = currentAnswerInfo;
                    }
                }
                lastSavingThisRef.current = isSavingThis;
            }, [isSavingThis, isExistingQuestion, currentAnswerInfo]);

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

            const updatePlaceholder = (newPlaceholder: string) => {
                editor.updateBlock(block, {
                    props: { ...block.props, placeholder: newPlaceholder },
                });
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
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Short Text</span>
                    </div>
                    {/* Question */}
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

                    {/* Answer Field */}
                    <input
                        type="text"
                        value={block.props.placeholder || ""}
                        onChange={(e) => updatePlaceholder(e.target.value)}
                        placeholder={"Enter your answer..."}
                        className="w-full text-sm border border-gray-200 bg-gray-100 p-2 rounded mt-2 text-gray-400"
                    />

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