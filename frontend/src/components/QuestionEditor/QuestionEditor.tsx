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
    const RemoveBlocksRef = useRef<((blocksToRemove: any) => any) | null>(null);
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

    // Attempt to load existing question info from DB
    const existingContent = useMemo<PartialBlock[]>(() => {
        if (initialBlocks && initialBlocks.length > 0) {
            return initialBlocks as PartialBlock[];
        }

        return JSON.parse(JSON.stringify(DEFAULT_INITIAL_CONTENT)) as PartialBlock[];
    }, [initialBlocks]);

    // Creates a new editor instance with the custom schema
    const editor = useCreateBlockNote({
        schema,
        existingContent,
    });

    const isSlashMenuOpenRef = useRef(false);
    const latestSlashItemsRef = useRef<any[]>([]);
    const userNavigatedMenuRef = useRef(false);

    // Issue: When the slash menu is open, the first item is not selected when Enter is pressed
    // Solution: We keep track of whether the slash menu is open and the latest items it displays.
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isSlashMenuOpenRef.current) return;

            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                userNavigatedMenuRef.current = true;
                return;
            }

            if (e.key === "Escape") {
                isSlashMenuOpenRef.current = false;
                userNavigatedMenuRef.current = false;
                return;
            }

            if (e.key === "Enter" && !e.shiftKey) {
                if (!userNavigatedMenuRef.current && latestSlashItemsRef.current.length > 0) {
                    e.preventDefault();
                    const first = latestSlashItemsRef.current[0];
                    if (first && typeof first.onItemClick === "function") {
                        first.onItemClick();
                        isSlashMenuOpenRef.current = false;
                        userNavigatedMenuRef.current = false;
                    }
                }
            }
        };

        document.addEventListener("keydown", handleKeyDown, { capture: true });
        return () => document.removeEventListener("keydown", handleKeyDown, { capture: true } as any);
    }, []);

    useEffect(() => {
        const removeBlocks = editor.removeBlocks;
        RemoveBlocksRef.current = removeBlocks;
        
        (editor as any).removeBlocks = (blocksToRemove: any) => {
            const blocks = blocksToRemove.map((idOrBlock: any) => {
                if (typeof idOrBlock === 'string') {
                    return editor.document.find((b) => b.id === idOrBlock);
                }
                return idOrBlock;
            }).filter(Boolean) as Block[];

            const blockIds = blocks.map(b => b.id);
            const isAlreadyDeleting = blockIds.some(id => deletingBlockIdsRef.current.has(id));
            
            if (isConfirmedDeleteRef.current || isAlreadyDeleting) {
                if (isConfirmedDeleteRef.current) {
                    isConfirmedDeleteRef.current = false;
                }
                return removeBlocks.call(editor, blocksToRemove);
            }

            const existingQuestionBlocks = blocks.filter((block) => {
                const blockProps = (block as any).props || {};
                return !!(blockProps.questionId as string);
            });

            if (existingQuestionBlocks.length > 0 && onDeleteQuestion) {
                setPendingDeleteBlocks(blocks);
                setShowDeleteDialog(true);
                return [];
            }

            return removeBlocks.call(editor, blocksToRemove);
        };
    }, [editor, onDeleteQuestion]);

    // When popup appears and user click delete
    const handleConfirmDelete = async () => {
        setShowDeleteDialog(false);
        if (pendingDeleteBlocks.length > 0) {
            const blockIds = pendingDeleteBlocks.map(b => b.id);
            blockIds.forEach(id => deletingBlockIdsRef.current.add(id));
            
            isConfirmedDeleteRef.current = true;
            
            if (onDeleteQuestion) {
                for (const block of pendingDeleteBlocks) {
                    await onDeleteQuestion(block);
                }
            } else {
                if (RemoveBlocksRef.current) {
                    isConfirmedDeleteRef.current = true;
                    RemoveBlocksRef.current.call(editor, pendingDeleteBlocks.map(b => b.id));
                }
            }
            
            blockIds.forEach(id => deletingBlockIdsRef.current.delete(id));
            setPendingDeleteBlocks([]);
        }
    };
    
    // When popup appears and user click cancel
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

        latestInitialBlocksRef.current = initialBlocks;

        if (lastDocumentKeyRef.current === undefined) {
            lastDocumentKeyRef.current = documentKey;
            return;
        }

        if (documentKey !== lastDocumentKeyRef.current) {
            const content =
                Array.isArray(initialBlocks) && initialBlocks.length > 0
                    ? (initialBlocks as PartialBlock[])
                    : (Array.isArray(latestInitialBlocksRef.current) && latestInitialBlocksRef.current.length > 0
                        ? (latestInitialBlocksRef.current as PartialBlock[])
                        : (JSON.parse(JSON.stringify(DEFAULT_INITIAL_CONTENT)) as PartialBlock[]));
            
            setTimeout(() => {
                const blocksToRemove = editor.document.map((block) => block.id);
                editor.replaceBlocks(blocksToRemove, content as any);
            }, 0);
            lastDocumentKeyRef.current = documentKey;
        }
    }, [documentKey, editor, initialBlocks]);

    // When user edited a question, it calls this to save the updated question 
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
                            getItems={async (query) => {
                                isSlashMenuOpenRef.current = true;
                                const items = filterSuggestionItems(getQuestionSlashMenuItems(editor), query);
                                latestSlashItemsRef.current = items;
                                userNavigatedMenuRef.current = false;
                                return items;
                            }}
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