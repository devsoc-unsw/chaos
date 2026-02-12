"use client";

import {
    ColumnDef,
    ColumnFiltersState,
    Row,
    RowSelectionState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getExpandedRowModel,
    useReactTable,
} from "@tanstack/react-table";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import React from "react";
import { RoleDetails } from "@/models/campaign";

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    roles: RoleDetails[];
    dict: any;
    acceptedApplicationIds: Set<string>;
    acceptedApplications: Map<string, string>; // Map of applicationId -> selectedRoleId
    rejectedApplicationIds: Set<string>;
    offerTemplateId?: string;
    renderSubComponent?: (props: { row: Row<TData> }) => React.ReactNode;
}

export function ApplicationSummaryDataTable<TData, TValue>({
    columns,
    data,
    roles,
    dict,
    acceptedApplicationIds,
    acceptedApplications,
    rejectedApplicationIds,
    offerTemplateId,
    renderSubComponent,
}: DataTableProps<TData, TValue>) {
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
    const rowSelection = React.useMemo(() => {
        const selection: RowSelectionState = {};
        data.forEach((item: any, index) => {
            if (acceptedApplicationIds.has(item.application_id)) {
                selection[index] = true;
            }
        });
        return selection;
    }, [data, acceptedApplicationIds]);

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getExpandedRowModel: getExpandedRowModel(),
        getRowCanExpand: () => true,
        onColumnFiltersChange: setColumnFilters,
        getFilteredRowModel: getFilteredRowModel(),
        state: {
            columnFilters,
            rowSelection,
        },
    });

    const handleSendEmails = () => {
        // Build acceptance/rejection email data
        // TODO: Need to see Azhad API implemention for request body for formatting JSON 
        const acceptanceData = Array.from(acceptedApplications.entries()).map(([appId, selectedRoleId]) => {
            return `${appId} [Role: ${selectedRoleId}]`;
        });

        // Build rejection email data
        const rejectionData = Array.from(rejectedApplicationIds);

        if (acceptanceData.length > 0) {
            const offerEmailPart = offerTemplateId ? `[EmailTemplate: ${offerTemplateId}] ` : '';
            console.log(`Sent Acceptance Email ${offerEmailPart}to ApplicationIDs:`, acceptanceData);
        }
        
        if (rejectionData.length > 0) {
            console.log(`Sent Rejection Email to ApplicationIDs:`, rejectionData);
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between py-4">
                <Select
                    value={(table.getColumn("applied_roles")?.getFilterValue() as string) ?? "all"}
                    onValueChange={(value) =>
                        table.getColumn("applied_roles")?.setFilterValue(value === "all" ? undefined : value)
                    }
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder={dict.dashboard.campaigns.application_summary_page.filter_by_role} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectLabel>{dict.common.roles}</SelectLabel>
                            <SelectItem value="all">{dict.dashboard.campaigns.application_summary_page.all_roles}</SelectItem>
                            {
                                roles.map((role) => <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>)
                            }
                        </SelectGroup>
                    </SelectContent>
                </Select>
                <Button variant="outline" onClick={handleSendEmails} 
                disabled={acceptedApplicationIds.size === 0 && rejectedApplicationIds.size === 0} className="gap-2 border-gray-400 hover:border-gray-500"
                >
                    <Mail className="h-4 w-4" />
                    Send Emails
                </Button>
            </div>
            <div className="overflow-hidden rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    )
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <React.Fragment key={row.id}>
                                    <TableRow
                                        data-state={row.getIsSelected() && "selected"}
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id}>
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                    {row.getIsExpanded() && (
                                        <>
                                            {renderSubComponent?.({ row })}
                                        </>
                                    )}
                                </React.Fragment>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}