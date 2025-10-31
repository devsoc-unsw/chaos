import { createReactBlockSpec } from "@blocknote/react";
import { useQuestionSave } from "../QuestionSaveContext";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";



export const shortTextBlock = createReactBlockSpec(
    {
        type: "textQuestion",
        propSchema: {
            question: { default: "" },
            description: { default: "" },
            placeholder: { default: "" },
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