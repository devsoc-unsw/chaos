import React, { useEffect, useMemo, useRef, useState } from "react";
import { createReactBlockSpec } from "@blocknote/react";
import type { Block } from "@blocknote/core";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
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

type Option = {
    id: string;
    text: string;
    correct: boolean;
};

// Ranking Question Block
export const rankingQuestionBlock = createReactBlockSpec(
    {
        type: "rankingQuestion",
        propSchema: {
            question: { default: "" },
            description: { default: "" },
            options: {
                default: JSON.stringify([
                    { id: "opt-1", text: "Option 1", correct: false },
                    { id: "opt-2", text: "Option 2", correct: false }
                ])
            },
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
            const [lockAfterSave, setLockAfterSave] = useState(false);

            // Created a temporary state of options
            const [OptionsState, setOptionsState] = useState<Option[] | null>(null);
            
            const blockOptions: Option[] = useMemo(() => {
                try {
                    const parsed = JSON.parse((block.props.options as string) || "[]");
                    return parsed.map((opt: any, i: number) => ({
                        id: opt.id || `opt-${block.id}-${i}`,
                        text: opt.text || "",
                        correct: opt.correct || false,
                    }));
                } catch {
                    return [];
                }
            }, [block.props.options, block.id]);

            const options = OptionsState || blockOptions;

            useEffect(() => {
                if (OptionsState && JSON.stringify(blockOptions) === JSON.stringify(OptionsState)) {
                    setOptionsState(null);
                }
            }, [blockOptions, OptionsState]);

            const updateQuestion = (newQuestion: string) => {
                editor.updateBlock(block, { props: { ...block.props, question: newQuestion } });
            };

            const updateDescription = (newDescription: string) => {
                editor.updateBlock(block, { props: { ...block.props, description: newDescription } });
            };

            // Track previous answer info to current answer info to detect changes for edit button lockout
            // ISSUE: When user reorder/updates the options, the currentAnswerInfo will not be updated so the edit button will not be locked out
            const initialAnswerInfo = useRef<string | null>(null);
            const currentAnswerInfo = useMemo(() => {
                const normalized = options.map(opt => ({
                    id: opt.id || "",
                    text: (opt.text || "").trim(),
                    correct: opt.correct || false,
                }));
                return JSON.stringify({
                    question: ((block.props.question as string) || "").trim(),
                    description: ((block.props.description as string) || "").trim(),
                    options: normalized,
                });
            }, [block.props.question, block.props.description, options]);

            useEffect(() => {
                if (isExistingQuestion && !initialAnswerInfo.current) {
                    initialAnswerInfo.current = currentAnswerInfo;
                }
            }, [isExistingQuestion, currentAnswerInfo]);

            const isEdited = isExistingQuestion 
                ? (initialAnswerInfo.current !== null && initialAnswerInfo.current !== currentAnswerInfo)
                : true;

            const lastSavingRef = useRef(false);
            useEffect(() => {
                if (lastSavingRef.current && !isSavingThis && isExistingQuestion) {
                    initialAnswerInfo.current = currentAnswerInfo;
                    setOptionsState(null);
                    setLockAfterSave(true);
                }
                lastSavingRef.current = isSavingThis;
            }, [isSavingThis, isExistingQuestion, currentAnswerInfo]);

            useEffect(() => {
                if (isEdited) setLockAfterSave(false);
            }, [isEdited]);

            const updateOptions = (newOptions: Option[]) => {
                setOptionsState(newOptions);
                editor.updateBlock(block, { props: { ...block.props, options: JSON.stringify(newOptions) } });
            };

            const updateOption = (optionId: string, key: keyof Option, value: string | boolean) => {
                updateOptions(options.map(opt => opt.id === optionId ? { ...opt, [key]: value } : opt));
            };

            const addOption = () => {
                updateOptions([...options, { id: `opt-${Date.now()}`, text: "", correct: false }]);
            };

            const removeOption = (optionId: string) => {
                if (options.length > 1) {
                    updateOptions(options.filter(opt => opt.id !== optionId));
                }
            };

            const handleDragEnd = (result: DropResult) => {
                if (!result.destination) return;
                if (result.destination.index === result.source.index) return;
                
                const currentOptions = OptionsState || blockOptions;
                const newOptions = Array.from(currentOptions);
                const [reordered] = newOptions.splice(result.source.index, 1);
                newOptions.splice(result.destination.index, 0, reordered);
                updateOptions(newOptions);
            };

            const handleOptionFocus = (optionId: string, currentValue: string) => {
                if (currentValue?.match(/^Option \d+$/)) {
                    updateOption(optionId, "text", "");
                }
            };

            const handleDeleteClick = () => {
                isExistingQuestion ? setShowDeleteDialog(true) : editor.removeBlocks([block]);
            };

            const handleConfirmDelete = () => {
                setShowDeleteDialog(false);
                onDeleteQuestion?.(block as unknown as Block);
            };

            return (
                <div className="border border-gray-300 rounded-md p-3 bg-white shadow-sm w-full">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">Ranking</span>
                    </div>

                    <input type="text" value={block.props.question || ""} onChange={e => updateQuestion(e.target.value)} 
                    className="w-full text-base font-medium border border-gray-400 bg-gray-50 p-2 rounded mb-3 text-black" placeholder="Enter your question..." />

                    <input type="text" value={block.props.description || ""} onChange={e => updateDescription(e.target.value)} 
                    className="w-full text-sm border border-gray-300 bg-gray-50 p-2 rounded mb-3 text-gray-600" placeholder="Add a description (optional)..." />

                    <DragDropContext onDragEnd={handleDragEnd}>
                        <Droppable droppableId="ranking-options">
                            {(provided) => (
                                <div
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    className="space-y-2"
                                >
                                    {options.map((option, index) => (
                                        <Draggable
                                            key={option.id}
                                            draggableId={option.id}
                                            index={index}
                                        >
                                            {(provided, snapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    className={`flex items-center gap-2 p-2 rounded transition-colors ${snapshot.isDragging
                                                        ? "bg-orange-50 shadow-lg border border-orange-200"
                                                        : "bg-gray-50 hover:bg-gray-100"
                                                        }`}
                                                >
                                                    <div
                                                        {...provided.dragHandleProps}
                                                        className="cursor-grab active:cursor-grabbing p-1"
                                                    >
                                                        <svg
                                                            width="16"
                                                            height="16"
                                                            viewBox="0 0 16 16"
                                                            className="text-gray-400"
                                                        >
                                                            <circle cx="4" cy="4" r="1" fill="currentColor" />
                                                            <circle cx="12" cy="4" r="1" fill="currentColor" />
                                                            <circle cx="4" cy="8" r="1" fill="currentColor" />
                                                            <circle cx="12" cy="8" r="1" fill="currentColor" />
                                                            <circle cx="4" cy="12" r="1" fill="currentColor" />
                                                            <circle cx="12" cy="12" r="1" fill="currentColor" />
                                                        </svg>
                                                    </div>

                                                    <span className="bg-orange-200 text-orange-800 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium">
                                                        {index + 1}
                                                    </span>

                                                    <input
                                                        type="text"
                                                        value={option.text}
                                                        onChange={(e) => updateOption(option.id, "text", e.target.value)}
                                                        onFocus={(e) => handleOptionFocus(option.id, e.target.value)}
                                                        className="flex-1 border-none outline-none bg-white p-2 rounded text-black"
                                                        placeholder={`Option ${index + 1}`}
                                                    />

                                                    {options.length > 1 && (
                                                        <button
                                                            onClick={() => removeOption(option.id)}
                                                            className="text-red-500 hover:text-red-700 p-1"
                                                        >
                                                            ✕
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </DragDropContext>

                    <button
                        onClick={addOption}
                        className="w-full text-orange-600 hover:text-orange-800 border border-dashed border-orange-300 p-2 rounded mt-2"
                    >
                        + Add Option
                    </button>

                    <div className="mt-4 flex justify-end items-center gap-2">
                        <button
                            onClick={() => onSaveQuestion?.(block as unknown as Block)}
                            disabled={
                                isSavingThis ||
                                !block.props.question ||
                                (isExistingQuestion && (!isEdited || lockAfterSave))
                            }
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSavingThis ? "Saving..." : isExistingQuestion ? "Edit Question" : "Create Question"}
                        </button>
                    </div>

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
