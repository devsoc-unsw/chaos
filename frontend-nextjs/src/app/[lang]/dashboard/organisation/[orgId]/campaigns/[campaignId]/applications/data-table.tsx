"use client";

import React, { Dispatch, SetStateAction, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getCampaign } from "@/models/campaign";
import { SendEmailsApplicant, SendEmailsModal } from "./send-email-modal";
import { useQuery } from "@tanstack/react-query";
import { queueCampaignOutcomeEmails } from "@/models/email";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  dict: any;
  setColumnFilters: Dispatch<SetStateAction<ColumnFiltersState>>;
  columnFilters: ColumnFiltersState;
  renderSubComponent?: (props: { row: Row<TData> }) => React.ReactNode;
  orgId: string;
  campaignId: string;
  color: string;
  label: string;
  /** Show selection checkboxes + thank-you email button. */
  sendEmails?: boolean;
  /** Maps a row to a thank-you recipient (required when sendEmails). */
  getApplicant?: (row: TData) => SendEmailsApplicant;
  sortBy?: "decision" | "name" | "portfolio";
  setSortBy?: Dispatch<SetStateAction<"decision" | "name" | "portfolio">>;
}

export function ApplicationSummaryDataTable<TData, TValue>({
  columns,
  data,
  dict,
  columnFilters,
  setColumnFilters,
  renderSubComponent,
  orgId,
  campaignId,
  color,
  label,
  sendEmails,
  getApplicant,
  sortBy,
  setSortBy,
}: DataTableProps<TData, TValue>) {
  const router = useRouter();
  const colorMap: Record<string, string> = {
    "bg-green-100": "border-green-100",
    "bg-red-100": "border-red-100",
  };

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [sendModalOpen, setSendModalOpen] = useState(false);

  const selectionColumn = useMemo<ColumnDef<TData, TValue>[]>(() => {
    if (!sendEmails) return [];
    return [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
            onClick={(e) => e.stopPropagation()}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ];
  }, [sendEmails]);

  const tableColumns = useMemo(
    () => [...selectionColumn, ...columns],
    [selectionColumn, columns],
  );

  const table = useReactTable<TData>({
    data,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: () => true,
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    enableRowSelection: !!sendEmails,
    onRowSelectionChange: setRowSelection,
    getRowId: (row) => {
      const app = row as { application_id?: string };
      return app.application_id ?? "";
    },
    state: {
      columnFilters,
      rowSelection,
    },
  });

  const selectedApplicants = useMemo(() => {
    if (!getApplicant) return [];
    return table
      .getSelectedRowModel()
      .rows.map((row) => getApplicant(row.original));
    // rowSelection must be a dep so selection updates recompute recipients
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getApplicant, rowSelection, data]);

  const borderColor = colorMap[color] || "border-gray-200";

  const { data: campaign } = useQuery({
    queryKey: [`${campaignId}-campaign-details`],
    queryFn: () => getCampaign(campaignId),
  });

  return (
    <div>
      <div className="flex justify-between items-end">
        <div
          className={`flex items-center justify-center w-24 h-9 ${color} rounded-t-md`}
        >
          <p className="text-sm font-semibold">{label}</p>
        </div>

        <div className="flex mb-2 gap-2 items-center">
          {sendEmails && (
            <>
              {selectedApplicants.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  {selectedApplicants.length} selected
                </span>
              )}
              <Button
                variant="outline"
                onClick={() => setSendModalOpen(true)}
                className="gap-2"
                disabled={selectedApplicants.length === 0}
              >
                <Send className="size-4" />
                Send emails
              </Button>
              <SendEmailsModal
                open={sendModalOpen}
                onOpenChange={setSendModalOpen}
                orgId={orgId}
                recipients={selectedApplicants}
                organisationName={campaign?.organisation_name}
                campaignName={campaign?.name}
                onSend={async (payload) => {
                  await queueCampaignOutcomeEmails(campaignId, payload);
                }}
              />
            </>
          )}

          {(label === "To Review" || label === "All") && setSortBy && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-sm text-foreground">
                <span>Sort by:</span>
                <Select
                  value={sortBy}
                  onValueChange={(v) =>
                    setSortBy(v as "decision" | "name" | "portfolio")
                  }
                >
                  <SelectTrigger className="h-auto w-14 border-0 shadow-none bg-transparent p-0 focus:ring-0 text-sm underline [&_svg]:hidden">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="decision">Decision</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="portfolio">Portfolio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {orgId && campaignId && (
                <Button
                  variant="outline"
                  onClick={() =>
                    router.push(
                      `/dashboard/organisation/${orgId}/campaigns/${campaignId}/review`,
                    )
                  }
                  className="gap-2"
                >
                  <Menu className="size-4" />
                  Start Queue
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className={`overflow-hidden border border-3 ${borderColor}`}>
        <TableWrapper>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
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
                          cell.getContext(),
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
