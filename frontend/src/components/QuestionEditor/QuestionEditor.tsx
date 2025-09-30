import "@blocknote/core/fonts/inter.css";
import { BlockNoteView, Theme, lightDefaultTheme } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import {
    useCreateBlockNote,
    SuggestionMenuController
} from "@blocknote/react";
import {
    BlockNoteSchema,
    defaultBlockSpecs,
    filterSuggestionItems
} from "@blocknote/core";
import {
    mcqQuestionBlock,
    shortTextBlock,
    multiSelectQuestionBlock,
    dropDownQuestionBlock,
    rankingQuestionBlock,
} from "./blocks/questionBlocks";
import { getQuestionSlashMenuItems } from "./config/slashMenuItems";
// Base theme
const lightTheme = {
    colors: {
        editor: {
            text: "#222222",
            background: "#ffffff",
        },
        menu: {
            text: "#333333",
            background: "#f5f5f5",
        },
        tooltip: {
            text: "#333333",
            background: "#e5e5e5",
        },
        hovered: {
            text: "#222222",
            background: "#e0e0e0",
        },
        selected: {
            text: "#222222",
            background: "#d0d0d0",
        },
        disabled: {
            text: "#999999",
            background: "#f0f0f0",
        },
        shadow: "#cccccc",
        border: "#dddddd",
        sideMenu: "#bababa",
        highlights: lightDefaultTheme.colors!.highlights,
    },
    borderRadius: 4,
    fontFamily: "Helvetica Neue, sans-serif",
} satisfies Theme;


export default function QuestionEditor() {
    // Create a custom schema with ONLY the blocks we want
    const schema = BlockNoteSchema.create({
        blockSpecs: {
            // Need paragraph for basic functionality, but slash menu will only show our items
            paragraph: defaultBlockSpecs.paragraph,
            mcqQuestion: mcqQuestionBlock(),
            textQuestion: shortTextBlock(),
            multiSelectQuestion: multiSelectQuestionBlock(),
            dropDownQuestion: dropDownQuestionBlock(),
            rankingQuestion: rankingQuestionBlock(),
        },
    });

    // Creates a new editor instance with the custom schema
    const editor = useCreateBlockNote({
        schema,
        initialContent: [
            {
                type: "paragraph",
                content: ""
            }
        ]
    });

    // Renders the editor instance using a React component.
    return (
        <div className="w-full h-full flex flex-col">
            <div className="flex-1 border rounded-lg  bg-slate-300">
                <BlockNoteView
                    editor={editor}
                    style={{
                        minHeight: '400px',
                        height: '100%'
                    }}
                    theme={lightTheme}
                >
                    <SuggestionMenuController
                        triggerCharacter="/"
                        onItemClick={(item: any) => {
                            item.onItemClick();
                        }}
                        getItems={async (query) =>
                            filterSuggestionItems(getQuestionSlashMenuItems(editor), query)
                        }
                    />
                </BlockNoteView>
            </div>
        </div>
    );
}