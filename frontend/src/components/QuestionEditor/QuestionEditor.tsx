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
    filterSuggestionItems,
    type Block,
    type PartialBlock,
    type BlockNoteEditor,
} from "@blocknote/core";
import {
    mcqQuestionBlock,
    shortTextBlock,
    multiSelectQuestionBlock,
    dropDownQuestionBlock,
    rankingQuestionBlock,
} from "./blocks/questionBlocks";
import { getQuestionSlashMenuItems } from "./config/slashMenuItems";
import { useEffect, useMemo, useRef, useState } from "react";
import { QuestionSaveContext } from "./QuestionSaveContext";

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

const DEFAULT_INITIAL_CONTENT: PartialBlock[] = [
    {
        type: "paragraph",
        content: [
            {
                type: "text",
                text: "",
                styles: {},
            },
        ],
    },
];

type Props = {
    campaignId: string;
    roleId: string | null;
    isCommon: boolean;
    onSaveQuestion?: (block: Block) => Promise<void>;
    onDeleteQuestion?: (block: Block) => Promise<void>;
    initialBlocks?: unknown[];
    documentKey?: string;
    onEditorReady?: (editor: BlockNoteEditor<any, any, any>) => void;
};

export default function QuestionEditor({ campaignId: _campaignId, roleId: _roleId, isCommon: _isCommon, onSaveQuestion, onDeleteQuestion, initialBlocks, documentKey, onEditorReady }: Props) {
    const [isSaving, setIsSaving] = useState(false);
    const [savingBlockId, setSavingBlockId] = useState<string | null>(null);
    const lastDocumentKeyRef = useRef<string | undefined>();
    const latestInitialBlocksRef = useRef<unknown[] | undefined>(initialBlocks);

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

    const initialContent = useMemo<PartialBlock[]>(() => {
        if (initialBlocks && initialBlocks.length > 0) {
            return initialBlocks as PartialBlock[];
        }

        return JSON.parse(JSON.stringify(DEFAULT_INITIAL_CONTENT)) as PartialBlock[];
    }, [initialBlocks]);

    // Creates a new editor instance with the custom schema
    const editor = useCreateBlockNote({
        schema,
        initialContent,
    });

    useEffect(() => {
        latestInitialBlocksRef.current = initialBlocks;
    }, [initialBlocks]);

    useEffect(() => {
        if (!documentKey) {
            return;
        }

        // Update ref with latest initialBlocks before checking documentKey
        latestInitialBlocksRef.current = initialBlocks;

        if (lastDocumentKeyRef.current === undefined) {
            lastDocumentKeyRef.current = documentKey;
            return;
        }

        if (documentKey !== lastDocumentKeyRef.current) {
            // Use the latest initialBlocks (which should already be set above)
            const content =
                Array.isArray(initialBlocks) && initialBlocks.length > 0
                    ? (initialBlocks as PartialBlock[])
                    : (Array.isArray(latestInitialBlocksRef.current) && latestInitialBlocksRef.current.length > 0
                        ? (latestInitialBlocksRef.current as PartialBlock[])
                        : (JSON.parse(JSON.stringify(DEFAULT_INITIAL_CONTENT)) as PartialBlock[]));
            
            // Defer replaceBlocks to avoid flushSync warning
            setTimeout(() => {
                const blocksToRemove = editor.document.map((block) => block.id);
                editor.replaceBlocks(blocksToRemove, content as any);
            }, 0);
            lastDocumentKeyRef.current = documentKey;
        }
    }, [documentKey, editor, initialBlocks]);

    const handleSaveQuestion = async (block: Block) => {
        if (!onSaveQuestion) return;
        
        setSavingBlockId(block.id);
        setIsSaving(true);
        try {
            await onSaveQuestion(block);
        } catch (error) {
            console.error("Failed to save question:", error);
        } finally {
            setIsSaving(false);
            setSavingBlockId(null);
        }
    };

    const handleDeleteQuestion = async (block: Block) => {
        if (!onDeleteQuestion) return;
        await onDeleteQuestion(block);
    };

    useEffect(() => {
        if (!onEditorReady) {
            return;
        }

        onEditorReady(editor);
    }, [editor, onEditorReady]);

    // Renders the editor instance using a React component.
    return (
        <QuestionSaveContext.Provider
            value={{
                onSaveQuestion: handleSaveQuestion,
                onDeleteQuestion: handleDeleteQuestion,
                isSaving: isSaving,
                savingBlockId: savingBlockId,
            }}
        >
            <div className="w-full h-full flex flex-col">
                <div className="flex-1 border rounded-lg  bg-slate-300 relative">
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
        </QuestionSaveContext.Provider>
    );
}