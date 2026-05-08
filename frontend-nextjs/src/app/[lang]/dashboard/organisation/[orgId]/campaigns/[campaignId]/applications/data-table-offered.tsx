import { RatingsShelf } from "./application-summary";
import { ApplicationSummaryDataTable } from "./data-table";
import { getColumns } from "./columns";
import { Row, type Table } from "@tanstack/react-table";
import { ApplicationRatingSummary, ApplicationStatus } from "@/models/application";
import { Dispatch, SetStateAction } from "react";

interface ApplicationSummaryDataTableOfferedProp<TData> {
  table: Table<TData>;
  dict?: any;
  setSendModalOpen?: Dispatch<SetStateAction<boolean>>;
  renderSubComponent?: (props: { row: Row<TData> }) => React.ReactNode;
  acceptedApplicants?: any[];
  rejectedApplicants?: any[];
}

export function ApplicationSummaryDataTableOffered<TData>({
  table,
  dict,
  setSendModalOpen,
  renderSubComponent,
  acceptedApplicants = [],
  rejectedApplicants = [],
}: ApplicationSummaryDataTableOfferedProp<ApplicationRatingSummary>) {
  return (
    <div className="flex flex-col gap-5">
      <ApplicationSummaryDataTable
        label="Offered"
        color="bg-green-100"
        table={table}
        dict={dict}
        setSendModalOpen={setSendModalOpen}
        acceptedApplicants={acceptedApplicants}
        rejectedApplicants={rejectedApplicants}
        renderSubComponent={renderSubComponent}
      />

      <ApplicationSummaryDataTable
        label="Outcome"
        color="bg-green-100"
        table={table}
        dict={dict}
        renderSubComponent={renderSubComponent}
      />
    </div>
  );
}