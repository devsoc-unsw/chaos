"use client";

import { ApplicationSummaryDataTable } from "./data-table";
import { ColumnDef, ColumnFiltersState, Row } from "@tanstack/react-table";
import {
  ApplicationRatingSummary,
  ApplicationStatus,
} from "@/models/application";
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useMemo,
  useState,
} from "react";
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
  getApplicant: (row: ApplicationRatingSummary) => SendEmailsApplicant;
  getAppRoleStatus: (
    applicationId: string,
    roleId: string,
  ) => ApplicationStatus | null;
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
  getApplicant,
  filteredRoleId = null,
  getAppRoleStatus,
}: ApplicationSummaryDataTableAllProp<ApplicationRatingSummary, TValue>) {
  const STATUS_ORDER: Record<string, number> = {
    Rejected: 0,
    Pending: 1,
    Interview: 2,
    Successful: 3,
  };
  const [sortBy, setSortBy] = useState<"decision" | "name" | "portfolio">(
    "decision",
  );

  const pendingMembers = useMemo(() => {
    return data.filter((m) => {
      if (filteredRoleId) {
        const status = getAppRoleStatus(m.application_id, filteredRoleId);
        return status === "Pending";
      }

      return m.private_status === "Pending";
    });
  }, [data, filteredRoleId, getAppRoleStatus]);

  const nonPendingMembers = useMemo(() => {
    return data.filter((m) => {
      if (filteredRoleId) {
        const status = getAppRoleStatus(m.application_id, filteredRoleId);
        return status !== "Pending";
      }
      return m.private_status !== "Pending";
    });
  }, [data, filteredRoleId, getAppRoleStatus]);

  const filteredMembers = useCallback(
    (members: ApplicationRatingSummary[]) => {
      return [...members].sort((a, b) => {
        if (sortBy === "name") return a.user_name.localeCompare(b.user_name);
        if (sortBy === "portfolio") {
          for (let i = 0; i < 3; i++) {
            const roleA = (a.applied_roles?.[i] ?? "").toString();
            const roleB = (b.applied_roles?.[i] ?? "").toString();
            const cmp = roleA.localeCompare(roleB);
            if (cmp !== 0) return cmp;
          }
          return 0;
        }

        if (!filteredRoleId) {
          return (
            (STATUS_ORDER[b.private_status] ?? 99) -
            (STATUS_ORDER[a.private_status] ?? 99)
          );
        }

        return (
          (STATUS_ORDER[
            getAppRoleStatus(
              b.application_id,
              filteredRoleId as string,
            ) as ApplicationStatus
          ] ?? 99) -
          (STATUS_ORDER[
            getAppRoleStatus(
              a.application_id,
              filteredRoleId as string,
            ) as ApplicationStatus
          ] ?? 99)
        );
      });
    },
    [sortBy, filteredRoleId, getAppRoleStatus],
  );

  return (
    <>
      {filteredRoleId ? (
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
          />
        </div>
      ) : (
        <div>
          <ApplicationSummaryDataTable
            columns={columns}
            data={filteredMembers(data)}
            dict={dict}
            setColumnFilters={setColumnFilters}
            columnFilters={columnFilters}
            label="All"
            color="bg-gray-200"
            orgId={orgId}
            campaignId={campaignId}
            renderSubComponent={renderSubComponent}
            sendEmails={true}
            getApplicant={getApplicant}
            sortBy={sortBy}
            setSortBy={setSortBy}
          />
        </div>
      )}
    </>
  );
}
