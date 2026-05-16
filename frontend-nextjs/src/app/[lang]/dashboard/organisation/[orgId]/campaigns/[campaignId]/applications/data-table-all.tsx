"use client";

import { ApplicationSummaryDataTable } from "./data-table";
import { ColumnDef, ColumnFiltersState, Row } from "@tanstack/react-table";
import { ApplicationRatingSummary } from "@/models/application";
import { Dispatch, SetStateAction, useMemo, useState } from "react";
import { SendEmailsApplicant } from "./send-email-modal";

interface ApplicationSummaryDataTableAllProp<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  dict: any;
  setColumnFilters: Dispatch<SetStateAction<ColumnFiltersState>>;
  columnFilters: ColumnFiltersState;
  renderSubComponent?: (props: { row: Row<TData> }) => React.ReactNode;
  orgId: string;
  campaignId: string;
  acceptedApplicants?: SendEmailsApplicant[];
  rejectedApplicants?: SendEmailsApplicant[];
}

export function ApplicationSummaryDataTableAll<TData, TValue>({
  columns,
  data,
  dict,
  columnFilters,
  setColumnFilters,
  renderSubComponent,
  orgId,
  campaignId,
  acceptedApplicants = [],
  rejectedApplicants = [],
}: ApplicationSummaryDataTableAllProp<ApplicationRatingSummary, TValue>) {
  const STATUS_ORDER: Record<string, number> = { Pending: 0, Successful: 1, Rejected: 2 };
  const [sortBy, setSortBy] = useState<"decision" | "name">("decision");
  const filteredMembers = useMemo(() => {
    const filtered = data.filter((m) => m.private_status === "Pending");
    return filtered.sort((a, b) => {
      if (sortBy === "name") return a.user_name.localeCompare(b.user_name);
      return (STATUS_ORDER[a.private_status] ?? 99) - (STATUS_ORDER[b.private_status] ?? 99);
    });
  }, [data, sortBy]);

  return (
    <div className="flex flex-col gap-5">
      <ApplicationSummaryDataTable
        columns={columns}
        data={filteredMembers}
        dict={dict}
        setColumnFilters={setColumnFilters}
        columnFilters={columnFilters}
        label="To Review"
        color="bg-gray-200"
        orgId={orgId}
        campaignId={campaignId}
        renderSubComponent={renderSubComponent}
        acceptedApplicants={acceptedApplicants}
        rejectedApplicants={rejectedApplicants}
        sortBy={sortBy}
        setSortBy={setSortBy}
      />

      <ApplicationSummaryDataTable
        label="Review"
        color="bg-gray-200"
        dict={dict}
        renderSubComponent={renderSubComponent}
        columns={columns}
        data={data.filter((m) => m.private_status !== "Pending")}
        setColumnFilters={setColumnFilters}
        columnFilters={columnFilters}
        orgId={orgId}
        campaignId={campaignId}
        sendEmails={true}
        acceptedApplicants={acceptedApplicants}
        rejectedApplicants={rejectedApplicants}
      />
    </div>
  );
}