import { ApplicationSummaryDataTable } from "./data-table";
import { ColumnDef, ColumnFiltersState, Row } from "@tanstack/react-table";
import { Dispatch, SetStateAction } from "react";
import { useQuery } from "@tanstack/react-query";
import { getOffersByCampaign, OfferDetails } from "@/models/offer";
import { SendEmailsApplicant } from "./send-email-modal";
import { ApplicationRatingSummary } from "@/models/application";

interface ApplicationSummaryDataTableOfferedProp<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  dict: any;
  data: TData[];
  setColumnFilters: Dispatch<SetStateAction<ColumnFiltersState>>;
  columnFilters: ColumnFiltersState;
  renderSubComponent?: (props: { row: Row<TData> }) => React.ReactNode;
  orgId: string;
  campaignId: string;
  acceptedApplicants?: SendEmailsApplicant[];
  rejectedApplicants?: SendEmailsApplicant[];
}

export function ApplicationSummaryDataTableOffered<TData, TValue>({
  columns,
  data,
  dict,
  setColumnFilters,
  columnFilters,
  renderSubComponent,
  orgId,
  campaignId,
  acceptedApplicants = [],
  rejectedApplicants = [],
}: ApplicationSummaryDataTableOfferedProp<ApplicationRatingSummary, TValue>) {
  const { data: offers } = useQuery({
    queryKey: [`${campaignId}-offer-details`],
    queryFn: () => getOffersByCampaign(campaignId),
  });

  const combinedData: ApplicationRatingSummary[] = data.map((app) => {
    const offer = offers?.find((o) => o.application_id === app.application_id);
    return {
      ...app,
      offer_role: offer ? offer.role_name : null,
      offer_status: offer ? offer.status : "Draft",
    };
  });

  return (
    <div className="flex flex-col gap-5">
      <ApplicationSummaryDataTable
        label="Offered"
        color="bg-green-100"
        data={data ?? []}
        dict={dict}
        renderSubComponent={renderSubComponent}
        columns={columns}
        setColumnFilters={setColumnFilters}
        columnFilters={columnFilters}
        orgId={orgId}
        campaignId={campaignId}
        sendEmails={true}
        acceptedApplicants={acceptedApplicants}
        rejectedApplicants={rejectedApplicants}
      />

      <ApplicationSummaryDataTable
        label="Outcome"
        color="bg-green-100"
        data={combinedData.filter((app) => app.offer_status !== null) ?? []}
        dict={dict}
        renderSubComponent={renderSubComponent}
        columns={columns}
        setColumnFilters={setColumnFilters}
        columnFilters={columnFilters}
        orgId={orgId}
        campaignId={campaignId}
        acceptedApplicants={acceptedApplicants}
        rejectedApplicants={rejectedApplicants}
      />
    </div>
  );
}