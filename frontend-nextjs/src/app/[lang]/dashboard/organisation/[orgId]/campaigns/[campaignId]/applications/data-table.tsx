"use client";

import React from "react";
import { Row, flexRender, type Table } from "@tanstack/react-table";
import {
  Table as TableWrapper,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ApplicationSummaryDataTableProp<TData> {
  table: Table<TData>;
  renderSubComponent?: (props: { row: Row<TData> }) => React.ReactNode;
}

export function ApplicationSummaryDataTable<TData>({
  table,
  renderSubComponent,
}: ApplicationSummaryDataTableProp<TData>) {
  return (
    <div>
      <div className="overflow-hidden rounded-md border border-2 border-red-500">
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
