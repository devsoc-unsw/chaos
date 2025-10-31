import QuestionEditor from "components/QuestionEditor/QuestionEditor";

/**
 * This page is an example of how to use the QuestionEditor component.
 * @returns {JSX.Element}
 */
export default function CreateQuestion() {
    // Example page - no save functionality
    return (
        <div className="h-screen w-full p-4">
            <div className="h-full max-w-4xl mx-auto">
                <QuestionEditor campaignId="" roleId={null} isCommon={true} />
            </div>
        </div>
    );
}