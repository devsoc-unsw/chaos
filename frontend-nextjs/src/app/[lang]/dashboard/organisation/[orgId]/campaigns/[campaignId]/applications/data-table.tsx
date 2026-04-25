"use client";

import React, { Dispatch, SetStateAction, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ColumnDef,
  ColumnFiltersState,
  Row,
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getCampaign, RoleDetails } from "@/models/campaign";
import { ApplicationRatingSummary } from "@/models/application";
import { SendEmailsApplicant, SendEmailsModal } from "./send-email-modal";
import { useQuery } from "@tanstack/react-query";
import { queueCampaignOutcomeEmails } from "@/models/email";

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    roles: RoleDetails[];
    dict: any;
    setColumnFilters: Dispatch<SetStateAction<ColumnFiltersState>>;
    columnFilters: ColumnFiltersState;
    renderSubComponent?: (props: { row: Row<TData> }) => React.ReactNode;
    orgId: string;
    campaignId: string;
    color: string;
    label: string;
    sendEmails?: boolean;
}

function toApplicant(
  app: ApplicationRatingSummary,
  roleIdsToNames: Record<string, string>
): SendEmailsApplicant {
  const applied = app.applied_roles ?? [];
  return {
    id: app.application_id,
    name: app.user_name,
    email: app.user_email,
    roleIds: applied,
    roles: applied.map((rid) => roleIdsToNames[rid] ?? rid),
  };
}

export function ApplicationSummaryDataTable<
  TData extends ApplicationRatingSummary,
  TValue
>({
  columns,
  data,
  roles,
  dict,
  columnFilters,
  setColumnFilters,
  renderSubComponent,
  orgId,
  campaignId,
  color,
  label,
  sendEmails,
}: DataTableProps<TData, TValue>) {
  const router = useRouter();
  const colorMap: Record<string, string> = {
    'bg-green-100': 'border-green-100',
    'bg-red-100': 'border-red-100',
  };

  const filteredMembers = useMemo(() => {
    const result = data.filter((m) => m.private_status === label);
    if (result.length === 0) return data;
    return result;
  }, [data, label]);

  const table = useReactTable<TData>({
    data: filteredMembers,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: () => true,
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      columnFilters,
    },
  });

  const borderColor = colorMap[color] || 'border-gray-200';

  const roleIdsToNames = useMemo(
    () =>
      roles.reduce(
        (acc, role) => {
          acc[role.id] = role.name;
          return acc;
        },
        {} as Record<string, string>
      ),
    [roles]
  );

  const members = data ?? [];
  const acceptedApplicants = useMemo(
    () =>
      members
        .filter((a) => a.private_status === "Successful")
        .map((a) => toApplicant(a, roleIdsToNames)),
    [members, roleIdsToNames]
  );
  const rejectedApplicants = useMemo(
    () =>
      members
        .filter((a) => a.private_status === "Rejected")
        .map((a) => toApplicant(a, roleIdsToNames)),
    [members, roleIdsToNames]
  );

  const [sendModalOpen, setSendModalOpen] = useState(false);
  const { data: campaign } = useQuery({
    queryKey: [`${campaignId}-campaign-details`],
    queryFn: () => getCampaign(campaignId),
  });

  return (
    <div>
      <div className="flex justify-between items-end">
        <div className={`flex items-center justify-center w-24 h-9 ${color} rounded-t-md`}>
          {/* Label */}
          <p className="text-sm font-semibold">{label}</p>
        </div>

        <div className="flex mb-2">
          {/* Send Outcome Emails Button */}
          {sendEmails && (
          <>
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
            <SendEmailsModal
                open={sendModalOpen}
                onOpenChange={setSendModalOpen}
                orgId={orgId}
                acceptedApplicants={acceptedApplicants}
                rejectedApplicants={rejectedApplicants}
                organisationName={campaign?.organisation_name}
                campaignName={campaign?.name}
                campaignEndsAt={campaign?.ends_at}
                onSend={async (payload) => {
                  await queueCampaignOutcomeEmails(campaignId, payload);
                }}
              />
          </>
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
            {orgId && campaignId && (
              <Button
                variant="outline"
                onClick={() => router.push(`/dashboard/organisation/${orgId}/campaigns/${campaignId}/review`) }
                className="gap-2"
              >
                <Menu className="size-4" />
              Start Queue
            </Button>
            )}
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
