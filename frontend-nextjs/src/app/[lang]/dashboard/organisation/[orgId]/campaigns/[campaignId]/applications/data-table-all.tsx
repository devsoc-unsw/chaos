"use client";

import { ApplicationSummaryDataTable } from "./data-table";
import { ColumnDef, ColumnFiltersState, Row } from "@tanstack/react-table";
import { ApplicationRatingSummary } from "@/models/application";
import { Dispatch, SetStateAction } from "react";
import { RoleDetails } from "@/models/campaign";

interface ApplicationSummaryDataTableAllProp<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  roles: RoleDetails[];
  dict: any;
  setColumnFilters: Dispatch<SetStateAction<ColumnFiltersState>>;
  columnFilters: ColumnFiltersState;
  renderSubComponent?: (props: { row: Row<TData> }) => React.ReactNode;
  orgId: string;
  campaignId: string;
}

export function ApplicationSummaryDataTableAll<TData, TValue>({
  columns,
  data,
  roles,
  dict,
  columnFilters,
  setColumnFilters,
  renderSubComponent,
  orgId,
  campaignId,
}: ApplicationSummaryDataTableAllProp<ApplicationRatingSummary, TValue>) {
  return (
    <div className="flex flex-col gap-5">
      <ApplicationSummaryDataTable
        columns={columns}
        data={data.filter((m) => m.private_status === "Pending")}
        roles={roles ?? []}
        dict={dict}
        setColumnFilters={setColumnFilters}
        columnFilters={columnFilters}
        label="To Review"
        color="bg-gray-200"
        orgId={orgId}
        campaignId={campaignId}
        renderSubComponent={renderSubComponent}
      />

      <ApplicationSummaryDataTable
        label="Review"
        color="bg-gray-200"
        dict={dict}
        renderSubComponent={renderSubComponent}
        columns={columns}
        data={data.filter((m) => m.private_status !== "Pending")}
        roles={roles ?? []}
        setColumnFilters={setColumnFilters}
        columnFilters={columnFilters}
        orgId={orgId}
        campaignId={campaignId}
        sendEmails={true}
      />
    </div>
  );
}