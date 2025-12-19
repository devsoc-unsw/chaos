"use client";

import { useQuery } from "@tanstack/react-query";
import { getApplicationAvgRatings } from "@/models/application";
import { getCampaign, getCampaignRoles } from "@/models/campaign";
import { dateToString } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DataTable } from "./data-table";
import { columns } from "./columns";

export default function ApplicationAvgRatingsClient({ campaignId, orgId, dict }: { campaignId: string; orgId: string; dict: any }) {
  const { data: campaign } = useQuery({
    queryKey: [`${campaignId}-campaign-details`],
    queryFn: () => getCampaign(campaignId),
  });
  const { data, isLoading } = useQuery({
    queryKey: [`${campaignId}-application-avg-ratings`],
    queryFn: () => getApplicationAvgRatings(campaignId),
  });
  const { data: roles } = useQuery({
    queryKey: [`${campaignId}-campaign-roles`],
    queryFn: () => getCampaignRoles(campaignId),
  });

  if (isLoading || !data) return <div>Loading...</div>;

  const roleOptions = roles?.map(role => ({
    id: role.id,
    name: role.name,
  })) || [];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between items-center">
        <div>
          <Link href={`/dashboard/organisation/${orgId}/campaigns/${campaignId}`}>
            <Button variant="ghost" className="mb-2">
              <ArrowLeft className="w-4 h-4" />
              {dict.common.back}
            </Button>
          </Link>
          <h1 className="text-lg font-bold">{campaign?.name}</h1>
          <h1 className="text-lg font-medium">{dict.dashboard.campaigns.application_avg_ratings}</h1>
          <p className="text-sm text-gray-500">{dateToString(campaign?.starts_at ?? "")} - {dateToString(campaign?.ends_at ?? "")}</p>
        </div>
      </div>
      <DataTable columns={columns} data={data} roles={roleOptions} />
    </div>
  );
}