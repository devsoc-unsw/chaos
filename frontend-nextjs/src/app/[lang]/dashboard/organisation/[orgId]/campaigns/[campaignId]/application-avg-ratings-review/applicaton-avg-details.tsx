"use client";

import { useQuery } from "@tanstack/react-query";
import { getApplicationAvgRatings, UserAvgApplicationRating } from "@/models/application";
import { getCampaign, getCampaignRoles } from "@/models/campaign";
import { dateToString } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DataTable } from "./data-table";
import { createColumns, AggregatedApplicationRating } from "./columns";
import { useMemo } from "react";

export default function ApplicationAvgRatingsApplicants({ campaignId, orgId, dict }: { campaignId: string; orgId: string; dict: any }) {
  const params = useParams();
  const lang = params.lang as string;

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

  // Transform data to group by application_id and calculate averages
  const aggregatedData = useMemo<AggregatedApplicationRating[]>(() => {
    if (!data) return [];

    // Group by application_id
    const grouped = data.reduce((acc, rating) => {
      const appId = rating.application_id;
      if (!acc[appId]) {
        acc[appId] = {
          application_id: appId,
          campaign_role_id: rating.campaign_role_id,
          campaign_role_name: rating.campaign_role_name,
          user_name: rating.user_name,
          user_email: rating.user_email,
          status: rating.status,
          ratings: [],
        };
      }
      acc[appId].ratings.push({
        rater_name: rating.rater_name,
        comment: rating.comment,
        rating: rating.rating,
        updated_at: rating.updated_at,
      });
      return acc;
    }, {} as Record<string, {
      application_id: string;
      campaign_role_id: string;
      campaign_role_name: string;
      user_name: string;
      user_email: string;
      status: string;
      ratings: Array<{
        rater_name: string;
        comment: string | null;
        rating: number;
        updated_at: string;
      }>;
    }>);

    // Calculate averages and format
    return Object.values(grouped).map(app => ({
      application_id: app.application_id,
      campaign_role_id: app.campaign_role_id,
      campaign_role_name: app.campaign_role_name,
      user_name: app.user_name,
      user_email: app.user_email,
      status: app.status as any,
      avg_rating: app.ratings.reduce((sum, r) => sum + r.rating, 0) / app.ratings.length,
      individual_ratings: app.ratings,
    }));
  }, [data]);

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
      <DataTable columns={createColumns(dict)} data={aggregatedData} roles={roleOptions} dict={dict} />
    </div>
  );
}