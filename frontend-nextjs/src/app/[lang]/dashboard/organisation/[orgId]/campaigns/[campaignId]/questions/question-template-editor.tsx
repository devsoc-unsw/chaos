"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, Save, X, Trash, Type, FileText, LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import { 
    CellData,
    TemplateData,
    QuestionTemplate
} from "@/models/interview_questions";

interface QuestionTemplateEditorProps {
    dict: any;
    initialTemplate?: QuestionTemplate | null;
    onSave?: (template: TemplateData) => void;
    onUpdate?: (templateId: string, template: TemplateData) => void;
    onCancel?: () => void;
    onDelete?: () => void;
}

export default function QuestionTemplateEditor({ dict, initialTemplate, onSave, onUpdate, onCancel, onDelete }: QuestionTemplateEditorProps) {
    // Initialize state from initialTemplate if provided
    const [templateName, setTemplateName] = useState(initialTemplate?.template_name?.toString() || "");
    const [columns, setColumns] = useState(
        initialTemplate ? Math.max(initialTemplate.header_row?.length || 0, initialTemplate.content_row?.length || 0, 4) : 4
    );
    const [headerRow, setHeaderRow] = useState<CellData[]>(
        initialTemplate?.header_row?.map(cell => ({
            value: cell.value || "",
            colSpan: cell.colSpan || 1,
            isMerged: cell.isMerged || false
        })) || Array(4).fill(null).map(() => ({ value: "", colSpan: 1, isMerged: false }))
    );
    const [contentRow, setContentRow] = useState<CellData[]>(
        initialTemplate?.content_row?.map(cell => ({
            value: cell.value || "",
            colSpan: cell.colSpan || 1,
            isMerged: cell.isMerged || false
        })) || Array(4).fill(null).map(() => ({ value: "", colSpan: 1, isMerged: false }))
    );
    const [selectedCells, setSelectedCells] = useState<{ row: number; col: number } | null>(null);
    const [mergeStart, setMergeStart] = useState<{ row: number; col: number } | null>(null);
    const [rowHeights, setRowHeights] = useState<{ [key: number]: number }>({
        0: 40, // Header row default height
        1: 80, // Content row default height
    });
    const [isResizing, setIsResizing] = useState<number | null>(null);
    const resizeRef = useRef<{ row: number; startY: number; startHeight: number } | null>(null);
    const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [viewMode, setViewMode] = useState<"horizontal" | "vertical">("horizontal");

    // Update state when initialTemplate changes
    useEffect(() => {
        if (initialTemplate) {
            setTemplateName(initialTemplate.template_name?.toString() || "");
            const headerLength = initialTemplate.header_row?.length || 0;
            const contentLength = initialTemplate.content_row?.length || 0;
            const maxLength = Math.max(headerLength, contentLength, 4);
            setColumns(maxLength);
            setHeaderRow(
                initialTemplate.header_row?.map(cell => ({
                    value: cell.value || "",
                    colSpan: cell.colSpan || 1,
                    isMerged: cell.isMerged || false
                })) || Array(maxLength).fill(null).map(() => ({ value: "", colSpan: 1, isMerged: false }))
            );
            setContentRow(
                initialTemplate.content_row?.map(cell => ({
                    value: cell.value || "",
                    colSpan: cell.colSpan || 1,
                    isMerged: cell.isMerged || false
                })) || Array(maxLength).fill(null).map(() => ({ value: "", colSpan: 1, isMerged: false }))
            );
        } else {
            // Reset to empty template
            setTemplateName("");
            setColumns(4);
            setHeaderRow(Array(4).fill(null).map(() => ({ value: "", colSpan: 1, isMerged: false })));
            setContentRow(Array(4).fill(null).map(() => ({ value: "", colSpan: 1, isMerged: false })));
        }
    }, [initialTemplate]);

    const addColumn = () => {
        setColumns(prev => prev + 1);
        setHeaderRow(prev => [...prev, { value: "", colSpan: 1, isMerged: false }]);
        setContentRow(prev => [...prev, { value: "", colSpan: 1, isMerged: false }]);
    };

    const updateCell = (rowIndex: number, colIndex: number, value: string) => {
        if (rowIndex === 0) {
            setHeaderRow(prev => {
                const newRow = [...prev];
                newRow[colIndex] = { ...newRow[colIndex], value };
                return newRow;
            });
        } else {
            setContentRow(prev => {
                const newRow = [...prev];
                newRow[colIndex] = { ...newRow[colIndex], value };
                return newRow;
            });
        }
    };

    const handleCellClick = (rowIndex: number, colIndex: number, e: React.MouseEvent) => {
        if (e.ctrlKey || e.metaKey) {
            // Ctrl/Cmd click to start merge
            if (rowIndex === 0) {
                setMergeStart({ row: rowIndex, col: colIndex });
                setSelectedCells({ row: rowIndex, col: colIndex });
            }
            return;
        }

        if (mergeStart) {
            // Complete merge
            if (rowIndex === mergeStart.row && colIndex !== mergeStart.col && rowIndex === 0) {
                const start = Math.min(mergeStart.col, colIndex);
                const end = Math.max(mergeStart.col, colIndex);
                const span = end - start + 1;

                setHeaderRow(prev => {
                    const newRow = [...prev];
                    // Combine values from merged cells
                    const combinedValue = newRow
                        .slice(start, end + 1)
                        .map(c => c.value)
                        .filter(v => v)
                        .join(" ");
                    
                    // Merge cells
                    newRow[start] = {
                        value: combinedValue || newRow[start].value,
                        colSpan: span,
                        isMerged: true
                    };
                    // Mark other cells as merged
                    for (let i = start + 1; i <= end; i++) {
                        newRow[i] = { ...newRow[i], isMerged: true, colSpan: 0, value: "" };
                    }
                    return newRow;
                });
                setMergeStart(null);
                setSelectedCells({ row: rowIndex, col: start });
            } else {
                setMergeStart(null);
                setSelectedCells({ row: rowIndex, col: colIndex });
            }
        } else {
            setSelectedCells({ row: rowIndex, col: colIndex });
        }
    };

    const handleSave = () => {
        if (!templateName.trim()) {
            toast.error(dict.dashboard.campaigns.template_editor.template_name_required);
            return;
        }

        const template: TemplateData = {
            name: templateName,
            headerRow: headerRow.filter(cell => !cell.isMerged || (cell.colSpan ?? 0) > 0),
            contentRow: contentRow.filter(cell => !cell.isMerged || (cell.colSpan ?? 0) > 0),
        };

        if (onSave) {
            onSave(template);
        }
    };

    const handleMouseDown = (rowIndex: number, e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(rowIndex);
        resizeRef.current = {
            row: rowIndex,
            startY: e.clientY,
            startHeight: rowHeights[rowIndex] || (rowIndex === 0 ? 40 : 80),
        };
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!resizeRef.current) return;

            const { row, startY, startHeight } = resizeRef.current;
            const deltaY = e.clientY - startY;
            const newHeight = Math.max(30, startHeight + deltaY); // Minimum height of 30px

            setRowHeights(prev => ({
                ...prev,
                [row]: newHeight,
            }));
        };

        const handleMouseUp = () => {
            setIsResizing(null);
            resizeRef.current = null;
        };

        if (isResizing !== null) {
            document.addEventListener("mousemove", handleMouseMove);
            document.addEventListener("mouseup", handleMouseUp);
            document.body.style.cursor = "row-resize";
            document.body.style.userSelect = "none";

            return () => {
                document.removeEventListener("mousemove", handleMouseMove);
                document.removeEventListener("mouseup", handleMouseUp);
                document.body.style.cursor = "";
                document.body.style.userSelect = "";
            };
        }
    }, [isResizing]);

    // Auto-save functionality with debouncing
    useEffect(() => {
        // Only auto-save if there's an existing template
        if (!initialTemplate || !onUpdate) {
            return;
        }

        // Clear any existing timeout
        if (autoSaveTimeoutRef.current) {
            clearTimeout(autoSaveTimeoutRef.current);
        }

        // Skip auto-save if template name is empty
        if (!templateName.trim()) {
            return;
        }

        // Auto-save after every 1 second of user not typing anything 
        autoSaveTimeoutRef.current = setTimeout(() => {
            const template: TemplateData = {
                name: templateName,
                headerRow: headerRow.filter(cell => !cell.isMerged || (cell.colSpan ?? 0) > 0),
                contentRow: contentRow.filter(cell => !cell.isMerged || (cell.colSpan ?? 0) > 0),
            };

            onUpdate(initialTemplate.template_id.toString(), template);
        }, 1000);

        // Cleanup timeout on unmount
        return () => {
            if (autoSaveTimeoutRef.current) {
                clearTimeout(autoSaveTimeoutRef.current);
            }
        };
    }, [templateName, headerRow, contentRow, initialTemplate, onUpdate]);

    const renderCell = (rowIndex: number, colIndex: number, cell: CellData) => {
        if (cell.isMerged && cell.colSpan === 0) {
            return null; // Don't render merged cells
        }

        const isSelected = selectedCells?.row === rowIndex && selectedCells?.col === colIndex;
        const isMergeStart = mergeStart?.row === rowIndex && mergeStart?.col === colIndex;

        return (
            <TableCell
                key={colIndex}
                colSpan={cell.colSpan || 1}
                className={cn(
                    "border p-0 min-w-[150px]",
                    isSelected && "ring-2 ring-blue-500",
                    isMergeStart && "ring-2 ring-green-500"
                )}
                onClick={(e) => handleCellClick(rowIndex, colIndex, e)}
            >
                <input
                    type="text"
                    value={cell.value}
                    onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                    className="w-full h-full px-2 py-1 border-0 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder={rowIndex === 0 ? dict.dashboard.campaigns.template_editor.question_heading_placeholder : dict.dashboard.campaigns.template_editor.question_goes_here_placeholder}
                />
            </TableCell>
        );
    };

    return (
        <div className="flex flex-col gap-4 h-full overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-4 pt-3 px-3 flex-shrink-0">
                <div className="flex items-center gap-4 flex-1">
                    <Input
                        placeholder={dict.dashboard.campaigns.template_editor.template_name_placeholder}
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                        className="max-w-xs"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 border rounded-md p-0.5">
                        <Button
                            variant={viewMode === "horizontal" ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setViewMode("horizontal")}
                            className="cursor-pointer h-7 px-2"
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </Button>
                        <Button
                            variant={viewMode === "vertical" ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setViewMode("vertical")}
                            className="cursor-pointer h-7 px-2"
                        >
                            <List className="w-4 h-4" />
                        </Button>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={addColumn}
                        className="relative cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                    </Button>
                    {onCancel && (
                        <Button className="cursor-pointer" variant="outline" size="sm" onClick={onCancel}>
                            <X className="w-4 h-4 mr-1" />
                            {dict.dashboard.campaigns.template_editor.cancel}
                        </Button>
                    )}
                    <Button className="cursor-pointer" size="sm" onClick={handleSave}>
                        <Save className="w-4 h-4 mr-1" />
                        {dict.dashboard.campaigns.template_editor.save_template}
                    </Button>
                    {initialTemplate && onDelete && (
                        <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={onDelete}
                            className="cursor-pointer"
                        >
                            <Trash className="w-4 h-4 mr-1" />
                            {dict.dashboard.campaigns.template_editor.delete}
                        </Button>
                    )}
                </div>
            </div>

            {/* Template view */}
            <div className="flex-1 overflow-auto border rounded-lg">
                {viewMode === "horizontal" ? (
                    /* Horizontal: Questions as columns (x-axis), Heading/Content as rows (y-axis) */
                    <Table className="border-collapse">
                        <TableHeader>
                            <TableRow style={{ height: `${rowHeights[0] || 40}px` }}>
                                <TableHead className="w-12 border bg-gray-50 sticky left-0 z-10">
                                    <div className="flex items-center justify-center py-1">
                                        <Type className="w-4 h-4 text-gray-500" />
                                    </div>
                                </TableHead>
                                {headerRow.map((cell, colIndex) => {
                                    if (cell.isMerged && cell.colSpan === 0) return null;
                                    return (
                                        <TableHead
                                            key={colIndex}
                                            colSpan={cell.colSpan || 1}
                                            className="border bg-gray-50 p-0 min-w-[150px] relative"
                                        >
                                            <input
                                                type="text"
                                                value={cell.value}
                                                onChange={(e) => updateCell(0, colIndex, e.target.value)}
                                                className="w-full h-full px-2 py-1 border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                placeholder={dict.dashboard.campaigns.template_editor.question_heading_placeholder}
                                                onClick={(e) => handleCellClick(0, colIndex, e)}
                                                style={{ height: `${rowHeights[0] || 40}px` }}
                                            />
                                            <div
                                                className="absolute bottom-0 left-0 right-0 h-1 cursor-row-resize hover:bg-blue-400 bg-transparent z-20"
                                                onMouseDown={(e) => handleMouseDown(0, e)}
                                            />
                                        </TableHead>
                                    );
                                })}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow style={{ height: `${rowHeights[1] || 80}px` }}>
                                <TableCell className="w-12 border bg-gray-50 sticky left-0 z-10">
                                    <div className="flex items-center justify-center">
                                        <FileText className="w-4 h-4 text-gray-500" />
                                    </div>
                                </TableCell>
                                {contentRow.map((cell, colIndex) => {
                                    if (cell.isMerged && cell.colSpan === 0) return null;
                                    return (
                                        <TableCell
                                            key={colIndex}
                                            colSpan={cell.colSpan || 1}
                                            className="border p-0 min-w-[150px] relative"
                                        >
                                            <textarea
                                                value={cell.value}
                                                onChange={(e) => updateCell(1, colIndex, e.target.value)}
                                                className="w-full h-full px-2 py-1 border-0 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                                                placeholder={dict.dashboard.campaigns.template_editor.question_goes_here_placeholder}
                                                style={{ height: `${rowHeights[1] || 80}px` }}
                                            />
                                            <div
                                                className="absolute bottom-0 left-0 right-0 h-1 cursor-row-resize hover:bg-blue-400 bg-transparent z-20"
                                                onMouseDown={(e) => handleMouseDown(1, e)}
                                            />
                                        </TableCell>
                                    );
                                })}
                            </TableRow>
                        </TableBody>
                    </Table>
                ) : (
                    /* Vertical: Questions as rows (y-axis), Heading/Content as columns (x-axis) */
                    <Table className="border-collapse">
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12 border bg-gray-50 sticky left-0 z-10"></TableHead>
                                <TableHead className="border bg-gray-50 p-0 min-w-[200px] relative">
                                    <div className="flex items-center gap-2 px-2 py-1">
                                        <Type className="w-4 h-4 text-gray-500" />
                                        <span className="text-sm font-medium">Heading</span>
                                    </div>
                                </TableHead>
                                <TableHead className="border bg-gray-50 p-0 min-w-[200px] relative">
                                    <div className="flex items-center gap-2 px-2 py-1">
                                        <FileText className="w-4 h-4 text-gray-500" />
                                        <span className="text-sm font-medium">Content</span>
                                    </div>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {Array.from({ length: columns }).map((_, colIndex) => {
                                const headerCell = headerRow[colIndex];
                                const contentCell = contentRow[colIndex];
                                
                                if (headerCell?.isMerged && headerCell.colSpan === 0 && 
                                    contentCell?.isMerged && contentCell.colSpan === 0) {
                                    return null;
                                }
                                
                                return (
                                    <TableRow key={colIndex} className="border-b">
                                        <TableCell className="w-12 border bg-gray-50 sticky left-0 z-10">
                                            <div className="flex items-center justify-center py-1 text-xs text-gray-500">
                                                {colIndex + 1}
                                            </div>
                                        </TableCell>
                                        <TableCell className="border p-0 min-w-[200px] relative">
                                            <input
                                                type="text"
                                                value={headerCell?.value || ""}
                                                onChange={(e) => updateCell(0, colIndex, e.target.value)}
                                                className="w-full h-full px-2 py-1 border-0 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                placeholder={dict.dashboard.campaigns.template_editor.question_heading_placeholder}
                                                style={{ minHeight: '40px' }}
                                            />
                                        </TableCell>
                                        <TableCell className="border p-0 min-w-[200px] relative">
                                            <textarea
                                                value={contentCell?.value || ""}
                                                onChange={(e) => updateCell(1, colIndex, e.target.value)}
                                                className="w-full h-full px-2 py-1 border-0 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                                                placeholder={dict.dashboard.campaigns.template_editor.question_goes_here_placeholder}
                                                style={{ minHeight: '80px' }}
                                            />
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                )}
            </div>

            {/* Instructions */}
            <div className="text-xs text-gray-500 border-t pt-2 flex-shrink-0">
                <p>• <strong>{dict.dashboard.campaigns.template_instructions.merge_cells}</strong> {dict.dashboard.campaigns.template_instructions.merge_cells_description}</p>
                <p>• <strong>{dict.dashboard.campaigns.template_instructions.add_columns}</strong> {dict.dashboard.campaigns.template_instructions.add_columns_description}</p>
                <p>• <strong>{dict.dashboard.campaigns.template_instructions.resize_rows}</strong> {dict.dashboard.campaigns.template_instructions.resize_rows_description}</p>
            </div>
        </div>
    );
}

