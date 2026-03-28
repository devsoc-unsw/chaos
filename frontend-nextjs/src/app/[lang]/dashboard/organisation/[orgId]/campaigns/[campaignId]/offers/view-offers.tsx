"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import { ArrowLeft } from "lucide-react";

import { dateToString } from "@/lib/utils";
import { getCampaign } from "@/models/campaign";
import { getOffersByCampaign, type OfferDetails } from "@/models/offer";
import { DataTable } from "@/components/ui/data-table";
type Props = {
  campaignId: string;
  orgId: string;
  dict: any;
};

export default function OffersOverview({ campaignId, orgId, dict }: Props) {
  const { data: campaign } = useQuery({
    queryKey: [`${campaignId}-campaign-details`],
    queryFn: () => getCampaign(campaignId),
  });

  const { data: offers } = useQuery({
    queryKey: [`${campaignId}-campaign-offers`],
    queryFn: () => getOffersByCampaign(campaignId),
  });

  const rows = offers ?? [];
  const columns: ColumnDef<OfferDetails>[] = [
    {
      accessorKey: "user_name",
      header: "Applicant",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.user_name}</span>
      ),
    },
    { accessorKey: "user_email", header: "Email" },
    { accessorKey: "role_name", header: "Role" },
    { accessorKey: "status", header: "Status" },
    {
      accessorKey: "expiry",
      header: "Expiry",
      cell: ({ row }) => dateToString(row.original.expiry),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between m-0">
        <div>
          <Link href={`/dashboard/organisation/${orgId}/campaigns/${campaignId}`}>
            <div className="flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" />
              {dict.common.back}
            </div>
          </Link>
          <h1 className="text-2xl font-bold">
            {dict.dashboard.campaigns.offers ?? "Offers"}
          </h1>
          <h2 className="text-lg font-medium">{campaign?.name}</h2>
          <p className="text-sm">
            {dateToString(campaign?.starts_at ?? "")} -{" "}
            {dateToString(campaign?.ends_at ?? "")}
          </p>
        </div>
      </div>
      <div>
        <div className="flex items-center py-2" />
        <DataTable columns={columns} data={rows} />
      </div>
    </div>
  );
}

