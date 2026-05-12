import { ApplicationSummaryDataTable } from "./data-table";
import { ColumnDef, ColumnFiltersState, Row, type Table } from "@tanstack/react-table";
import { ApplicationRatingSummary } from "@/models/application";
import { Dispatch, SetStateAction } from "react";
import { RoleDetails } from "@/models/campaign";

interface ApplicationSummaryDataTableOfferedProp<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  dict: any;
  data: TData[];
  roles: RoleDetails[];
  setColumnFilters: Dispatch<SetStateAction<ColumnFiltersState>>;
  columnFilters: ColumnFiltersState;
  renderSubComponent?: (props: { row: Row<TData> }) => React.ReactNode;
  orgId: string;
  campaignId: string;
}

export function ApplicationSummaryDataTableOffered<TData, TValue>({
  columns,
  data,
  dict,
  roles,
  setColumnFilters,
  columnFilters,
  renderSubComponent,
  orgId,
  campaignId,
}: ApplicationSummaryDataTableOfferedProp<ApplicationRatingSummary, TValue>) {
  return (
    <div className="flex flex-col gap-5">
      <ApplicationSummaryDataTable
        label="Offered"
        color="bg-green-100"
        data={data.filter((m) => m.private_status === "Successful")}
        roles={roles ?? []}
        dict={dict}
        renderSubComponent={renderSubComponent}
        columns={columns}
        setColumnFilters={setColumnFilters}
        columnFilters={columnFilters}
        orgId={orgId}
        campaignId={campaignId}
        skipStatusFilter
      />

      <ApplicationSummaryDataTable
        label="Outcome"
        color="bg-green-100"
        data={data.filter((m) => m.private_status === "Successful")}
        roles={roles ?? []}
        dict={dict}
        renderSubComponent={renderSubComponent}
        columns={columns}
        setColumnFilters={setColumnFilters}
        columnFilters={columnFilters}
        orgId={orgId}
        campaignId={campaignId}
        skipStatusFilter
        showOfferStatus
      />
    </div>
  );
}