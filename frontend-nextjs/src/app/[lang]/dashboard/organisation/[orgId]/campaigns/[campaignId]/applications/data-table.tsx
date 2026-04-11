"use client";

import { Row, flexRender, type Table } from "@tanstack/react-table";
import {
  Table as TableWrapper,
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
} from "@/components/ui/select";
import React from "react";
import { RoleDetails } from "@/models/campaign";

interface ApplicationSummaryDataTableProp<TData> {
  table: Table<TData>;
  dict: any;
  roles: RoleDetails[];
  renderSubComponent?: (props: { row: Row<TData> }) => React.ReactNode;
}

export function ApplicationSummaryDataTable<TData>({
  table,
  dict,
  roles,
  renderSubComponent,
}: ApplicationSummaryDataTableProp<TData>) {
  return (
    <div>
      <div className="flex items-center py-4">
        <Select
          value={
            (table.getColumn("applied_roles")?.getFilterValue() as string) ??
            "all"
          }
          onValueChange={(value) =>
            table
              .getColumn("applied_roles")
              ?.setFilterValue(value === "all" ? undefined : value)
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue
              placeholder={
                dict.dashboard.campaigns.application_summary_page.filter_by_role
              }
            />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>{dict.common.roles}</SelectLabel>
              <SelectItem value="all">
                {dict.dashboard.campaigns.application_summary_page.all_roles}
              </SelectItem>
              {roles.map((role) => (
                <SelectItem key={role.id} value={role.id}>
                  {role.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <div className="overflow-hidden rounded-md border">
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
