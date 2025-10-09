import React from "react";
import { createReactBlockSpec } from "@blocknote/react";

type Option = {
    text: string;
    correct: boolean;
};

// Multi-Select Question Block
export const multiSelectQuestionBlock = createReactBlockSpec(
    {
        type: "multiSelectQuestion",
        propSchema: {
            question: { default: "" },
            options: { default: JSON.stringify([{ text: "Option 1", correct: false }]) },
        },
        content: "none",
    },
    {
        render: (props) => {
            const { block, editor } = props;
            const options: Option[] = JSON.parse(block.props.options);

            const updateQuestion = (newQuestion: string) => {
                editor.updateBlock(block, {
                    props: { ...block.props, question: newQuestion },
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
                const newOptions = [...options, { text: `Option ${options.length + 1}`, correct: false }];
                editor.updateBlock(block, {
                    props: { ...block.props, options: JSON.stringify(newOptions) },
                });
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
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Multi-Select</span>
                    </div>

                    <input
                        type="text"
                        onChange={(e) => updateQuestion(e.target.value)}
                        className="w-full text-base font-medium border border-gray-400 bg-gray-50 p-2 rounded mb-3 text-black"
                        placeholder="Enter your question..."
                    />

                    <div className="space-y-2">
                        {options.map((option, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={option.correct}
                                    onChange={(e) => updateOption(index, "correct", e.target.checked)}
                                    className="h-4 w-4 text-green-600 rounded"
                                />
                                <input
                                    type="text"
                                    onChange={(e) => updateOption(index, "text", e.target.value)}
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
                            className="w-full text-green-600 hover:text-green-800 border border-dashed border-green-300 p-2 rounded"
                        >
                            + Add Option
                        </button>
                    </div>
                </div>
            );
        },
    }
);
