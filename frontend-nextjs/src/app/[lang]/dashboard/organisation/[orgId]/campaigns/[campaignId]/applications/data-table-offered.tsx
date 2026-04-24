import { RatingsShelf } from "./application-summary";
import { ApplicationSummaryDataTable } from "./data-table";
import { getColumns } from "./columns";
import { type Table } from "@tanstack/react-table";
import { ApplicationRatingSummary, ApplicationStatus } from "@/models/application";
import { Dispatch, SetStateAction } from "react";

interface ApplicationSummaryDataTableOfferedProp<TData> {
  table: Table<TData>;
  dict?: any;
  setSendModalOpen?: Dispatch<SetStateAction<boolean>>;
  roleIdsToNames: Record<string, string>;
  ratingCategories: any[];
  handlePrivateStatusChange: (applicantId: string, status: ApplicationStatus) => Promise<void>;
  acceptedApplicants?: any[];
  rejectedApplicants?: any[];
}

export function ApplicationSummaryDataTableOffered<TData>({
  table,
  dict,
  setSendModalOpen,
  roleIdsToNames,
  ratingCategories,
  handlePrivateStatusChange,
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
        renderSubComponent={({ row }) => (
          <RatingsShelf
            columns={getColumns(
              dict,
              roleIdsToNames,
              ratingCategories ?? [],
              handlePrivateStatusChange
            )}
            ratings={row.original.ratings}
            dict={dict}
          />
        )}
      />

      <ApplicationSummaryDataTable
        label="Outcome"
        color="bg-green-100"
        table={table}
        dict={dict}
        renderSubComponent={({ row }) => (
          <RatingsShelf
            columns={getColumns(
              dict,
              roleIdsToNames,
              ratingCategories ?? [],
              handlePrivateStatusChange
            )}
            ratings={row.original.ratings}
            dict={dict}
          />
        )}
      />
    </div>
  );
}