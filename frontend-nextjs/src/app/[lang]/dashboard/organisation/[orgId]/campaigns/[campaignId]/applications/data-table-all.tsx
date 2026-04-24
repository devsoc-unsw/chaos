import { RatingsShelf } from "./application-summary";
import { ApplicationSummaryDataTable } from "./data-table";
import { getColumns } from "./columns";
import { type Table } from "@tanstack/react-table";
import { ApplicationRatingSummary, ApplicationStatus } from "@/models/application";
import { Dispatch, SetStateAction } from "react";

interface ApplicationSummaryDataTableAllProp<TData> {
  tablePending: Table<TData>;
  dict?: any;
  setSendModalOpen?: Dispatch<SetStateAction<boolean>>;
  roleIdsToNames: Record<string, string>;
  ratingCategories: any[];
  handlePrivateStatusChange: (applicantId: string, status: ApplicationStatus) => Promise<void>;
  tableNonPending: Table<TData>;
  acceptedApplicants?: any[];
  rejectedApplicants?: any[];
}

export function ApplicationSummaryDataTableAll<TData>({
  dict,
  setSendModalOpen,
  roleIdsToNames,
  ratingCategories,
  handlePrivateStatusChange,
  tablePending  ,
  tableNonPending,
  acceptedApplicants = [],
  rejectedApplicants = [],
}: ApplicationSummaryDataTableAllProp<ApplicationRatingSummary>) {
  return (
    <div className="flex flex-col gap-5">
      <ApplicationSummaryDataTable
        label="To Review"
        color="bg-gray-200"
        table={tablePending}
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

      <ApplicationSummaryDataTable
        label="Review"
        color="bg-gray-200"
        table={tableNonPending}
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
    </div>
  );
}