import { createReactBlockSpec } from "@blocknote/react";



export const shortTextBlock = createReactBlockSpec(
    {
        type: "textQuestion",
        propSchema: {
            question: { default: "" },
            description: { default: "" },
            placeholder: { default: "" },
        },
        content: "none",
    },
    {
        render: (props) => {
            const { block, editor } = props;

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

                    {/* Answer Field */}
                    <input
                        type="text"
                        onChange={(e) => updatePlaceholder(e.target.value)}
                        placeholder={"Enter your answer..."}
                        className="w-full text-sm border border-gray-200 bg-gray-100 p-2 rounded mt-2 text-gray-400"
                    />
                </div>
            );
        },
    }
);