"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Row, flexRender, type Table } from "@tanstack/react-table";
import { Menu, Send } from "lucide-react";
import {
  Table as TableWrapper,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ApplicationSummaryDataTableProp<TData> {
  label: string;
  table: Table<TData>;
  color: string;
  renderSubComponent?: (props: { row: Row<TData> }) => React.ReactNode;
  dict?: any;
  setSendModalOpen?: (open: boolean) => void;
  acceptedApplicants?: any[];
  rejectedApplicants?: any[];
  orgId?: string;
  campaignId?: string;
}

export function ApplicationSummaryDataTable<TData>({
  label,
  color,
  table,
  renderSubComponent,
  dict,
  setSendModalOpen,
  acceptedApplicants = [],
  rejectedApplicants = [],
  orgId,
  campaignId,
}: ApplicationSummaryDataTableProp<TData>) {
  const router = useRouter();
  const colorMap: Record<string, string> = {
    'bg-green-100': 'border-green-100',
    'bg-red-100': 'border-red-100',
  };

  const borderColor = colorMap[color] || 'border-gray-200';

  return (
    <div>
      <div className="flex justify-between items-end">
        <div className={`flex items-center justify-center w-24 h-9 ${color} rounded-t-md`}>
          {/* Label */}
          <p className="text-sm font-semibold">{label}</p>
        </div>

        <div className="flex mb-2">
          {/* Send Outcome Emails Button */}
          {setSendModalOpen && dict && (
            <Button
              variant="outline"
              onClick={() => setSendModalOpen(true)}
              className="gap-2"
              disabled={
                acceptedApplicants.length === 0 && rejectedApplicants.length === 0
              }
            >
              <Send className="size-4" />
              {dict.dashboard.campaigns.send_outcome_emails ??
                "Send outcome emails"}
            </Button>
          )}

          {/* Sort By Dropdown */}
          {label === "To Review" && <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-sm text-foreground">
              <span>Sort by:</span>
              <Select defaultValue="decision">
                <SelectTrigger className="h-auto w-14 border-0 shadow-none bg-transparent p-0 focus:ring-0 text-sm underline [&_svg]:hidden">
                  <SelectValue/>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="decision">Decision</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                </SelectContent>
              </Select>
            </div>
            { // orgId && campaignId && 
            (
              <Button
                variant="outline"
                onClick={() => router.push(`/dashboard/organisation/${orgId}/campaigns/${campaignId}/review`) }
                className="gap-2"
              >
                <Menu className="size-4" />
              Start Queue
            </Button>)}
          </div>}
        </div>

      </div>
      {/* Table */}
      <div className={`overflow-hidden border border-3 ${borderColor}`}>
        <TableWrapper>
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
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <React.Fragment key={row.id}>
                  <TableRow data-state={row.getIsSelected() && "selected"}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                  {row.getIsExpanded() && <>{renderSubComponent?.({ row })}</>}
                </React.Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={table.getAllColumns().length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </TableWrapper>
      </div>
    </div>
  );
}
