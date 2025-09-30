import React from "react";
import { createReactBlockSpec } from "@blocknote/react";

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
                        <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">Dropdown</span>
                    </div>

                    <input
                        type="text"
                        onChange={(e) => updateQuestion(e.target.value)}
                        className="w-full text-base font-medium border border-gray-400 bg-gray-50 p-2 rounded mb-3 text-black"
                        placeholder="Enter your question..."
                    />

                    <textarea
                        onChange={(e) => updateDescription(e.target.value)}
                        className="w-full text-sm border border-gray-300 bg-gray-50 p-2 rounded mb-3 text-gray-600 resize-none"
                        placeholder="Add a description (optional)..."
                        rows={2}
                    />

                    <select disabled className="w-full border border-gray-300 bg-gray-100 p-2 rounded mb-3 text-gray-500">
                        <option>Select an option...</option>
                        {options.map((option, index) => (
                            <option key={index}>{option.text}</option>
                        ))}
                    </select>

                    <div className="space-y-2">
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
                            className="w-full text-purple-600 hover:text-purple-800 border border-dashed border-purple-300 p-2 rounded"
                        >
                            + Add Option
                        </button>
                    </div>
                </div>
            );
        },
    }
);
