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
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [pendingDeleteBlocks, setPendingDeleteBlocks] = useState<Block[]>([]);
    const isConfirmedDeleteRef = useRef(false);
    const deletingBlockIdsRef = useRef<Set<string>>(new Set());
    const originalRemoveBlocksRef = useRef<((blocksToRemove: any) => any) | null>(null);
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

    // Override removeBlocks to intercept deletions and show confirmation for existing questions
    useEffect(() => {
        // Store the original function BEFORE we override it
        const originalRemoveBlocks = editor.removeBlocks;
        originalRemoveBlocksRef.current = originalRemoveBlocks;
        
        // Override the function
        (editor as any).removeBlocks = (blocksToRemove: any) => {
            // Convert BlockIdentifier[] to Block[] for checking
            const blocks = blocksToRemove.map((idOrBlock: any) => {
                if (typeof idOrBlock === 'string') {
                    return editor.document.find((b) => b.id === idOrBlock);
                }
                return idOrBlock;
            }).filter(Boolean) as Block[];

            // Check if any of these blocks are already being deleted (via confirmed delete flow)
            const blockIds = blocks.map(b => b.id);
            const isAlreadyDeleting = blockIds.some(id => deletingBlockIdsRef.current.has(id));
            
            // If this is a confirmed delete or blocks are already being deleted, bypass interception
            if (isConfirmedDeleteRef.current || isAlreadyDeleting) {
                // Clear the flag after processing
                if (isConfirmedDeleteRef.current) {
                    isConfirmedDeleteRef.current = false;
                }
                // Note: Don't clear deletingBlockIdsRef here - let handleConfirmDelete clear it after completion
                return originalRemoveBlocks.call(editor, blocksToRemove);
            }

            // Check if any of the blocks being deleted are existing questions
            const existingQuestionBlocks = blocks.filter((block) => {
                const blockProps = (block as any).props || {};
                return !!(blockProps.questionId as string);
            });

            // If there are existing questions, show confirmation dialog
            if (existingQuestionBlocks.length > 0 && onDeleteQuestion) {
                setPendingDeleteBlocks(blocks);
                setShowDeleteDialog(true);
                return []; // Return empty array to prevent deletion
            }

            // For uncreated questions or if no onDeleteQuestion handler, delete directly using original
            return originalRemoveBlocks.call(editor, blocksToRemove);
        };
    }, [editor, onDeleteQuestion]);

    const handleConfirmDelete = async () => {
        setShowDeleteDialog(false);
        if (pendingDeleteBlocks.length > 0) {
            // Track which blocks are being deleted to prevent duplicate confirmations
            const blockIds = pendingDeleteBlocks.map(b => b.id);
            blockIds.forEach(id => deletingBlockIdsRef.current.add(id));
            
            // Set flag to bypass interception when handler calls removeBlocks
            isConfirmedDeleteRef.current = true;
            
            // Delete each existing question block via the handler if provided
            if (onDeleteQuestion) {
                for (const block of pendingDeleteBlocks) {
                    await onDeleteQuestion(block);
                }
            } else {
                // If no handler, just remove from editor directly
                if (originalRemoveBlocksRef.current) {
                    isConfirmedDeleteRef.current = true;
                    originalRemoveBlocksRef.current.call(editor, pendingDeleteBlocks.map(b => b.id));
                }
            }
            
            // Clear tracking after deletion completes
            blockIds.forEach(id => deletingBlockIdsRef.current.delete(id));
            setPendingDeleteBlocks([]);
        }
    };

    const handleCancelDelete = () => {
        setShowDeleteDialog(false);
        setPendingDeleteBlocks([]);
    };

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
                <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete Question</AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to delete this question? This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel onClick={handleCancelDelete}>Cancel</AlertDialogCancel>
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
        </QuestionSaveContext.Provider>
    );
}