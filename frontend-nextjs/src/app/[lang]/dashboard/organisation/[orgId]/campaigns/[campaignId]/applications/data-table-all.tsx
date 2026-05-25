"use client";

import { ApplicationSummaryDataTable } from "./data-table";
import { ColumnDef, ColumnFiltersState, Row } from "@tanstack/react-table";
import { ApplicationRatingSummary, ApplicationStatus, getApplicationRoleStatuses } from "@/models/application";
import { Dispatch, SetStateAction, useCallback, useMemo, useState } from "react";
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
  getAppRoleStatus: (applicationId: string, roleId: string) => ApplicationStatus | null;
  filteredRoleId: string | null;
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
  filteredRoleId = null,
  getAppRoleStatus
}: ApplicationSummaryDataTableAllProp<ApplicationRatingSummary, TValue>) {
  const STATUS_ORDER: Record<string, number> = { Pending: 0, Successful: 1, Rejected: 2 };
  const [sortBy, setSortBy] = useState<"decision" | "name">("decision");

  const pendingMembers = useMemo(() => {
    return data.filter((m) => {
      if (!filteredRoleId) return true;
      const status = getAppRoleStatus(m.application_id, filteredRoleId);
      return status === "Pending";
    });
  }, [data, filteredRoleId, getAppRoleStatus]);

  const nonPendingMembers = useMemo(() => {
    return data.filter((m) => {
      if (!filteredRoleId) return true;
      const status = getAppRoleStatus(m.application_id, filteredRoleId);
      return status !== "Pending";
    });
  }, [data, filteredRoleId, getAppRoleStatus]);

  const filteredMembers = useCallback((members: ApplicationRatingSummary[]) => {
    return [...members].sort((a, b) => {
      if (sortBy === "name") return a.user_name.localeCompare(b.user_name);
      return (STATUS_ORDER[getAppRoleStatus(a.application_id, filteredRoleId as string) as ApplicationStatus] ?? 99)
        - (STATUS_ORDER[getAppRoleStatus(b.application_id, filteredRoleId as string) as ApplicationStatus] ?? 99);
    });
  }, [sortBy, filteredRoleId, getAppRoleStatus]);

  return (
    <div className="flex flex-col gap-5">
      <ApplicationSummaryDataTable
        columns={columns}
        data={filteredMembers(pendingMembers)}
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
        label="Reviewed"
        color="bg-gray-200"
        dict={dict}
        renderSubComponent={renderSubComponent}
        columns={columns}
        data={filteredMembers(nonPendingMembers)}
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
