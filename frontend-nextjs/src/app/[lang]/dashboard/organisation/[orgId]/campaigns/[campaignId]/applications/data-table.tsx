"use client";

import React, { useEffect } from "react";
import { Row, flexRender, type Table } from "@tanstack/react-table";
import { Send } from "lucide-react";
import {
  Table as TableWrapper,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

interface ApplicationSummaryDataTableProp<TData> {
  label: string;
  table: Table<TData>;
  color: string;
  renderSubComponent?: (props: { row: Row<TData> }) => React.ReactNode;
  dict?: any;
  setSendModalOpen?: (open: boolean) => void;
  acceptedApplicants?: any[];
  rejectedApplicants?: any[];
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
}: ApplicationSummaryDataTableProp<TData>) {
  const colorMap: Record<string, string> = {
    'bg-green-100': 'border-green-100',
    'bg-red-100': 'border-red-100',
  };

  const borderColor = colorMap[color] || 'border-gray-200';

  return (
    <div>
      <div className="flex justify-between items-baseline ">
        <div className={`flex items-center justify-center w-24 h-9 ${color} rounded-t-md`}>
          {/* Label */}
          <p className="text-sm font-semibold">{label}</p>
        </div>
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
      </div>
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
