"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getCampaign, getCampaignApplications, getCampaignRoles } from "@/models/campaign";
import { ApplicationStatus, updateApplicationRoleStatus } from "@/models/application";
import { dateToString } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { ArrowLeft, Play, Form } from "lucide-react";
import Link from "next/link";
import { ReviewSidebar } from "./components/review-sidebar";
import { ApplicationPanel } from "./components/application-panel";

export default function ReviewCampaignApplications({
  campaignId,
  orgId,
  dict,
}: {
  campaignId: string;
  orgId: string;
  dict: any;
}) {
  const queryClient = useQueryClient();
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [ratedApplications, setRatedApplications] = useState<Record<string, boolean>>({});
  const [portFilter, setPortFilter] = useState<string>("all");

  const { data: campaign } = useQuery({
    queryKey: [`${campaignId}-campaign-details`],
    queryFn: () => getCampaign(campaignId),
  });

  const { data: applications } = useQuery({
    queryKey: [`${campaignId}-campaign-applications`],
    queryFn: () => getCampaignApplications(campaignId),
  });

  const { data: campaignRoles } = useQuery({
    queryKey: [`${campaignId}-campaign-roles`],
    queryFn: () => getCampaignRoles(campaignId),
  });

  useEffect(() => {
    if (!applications) return;
    setRatedApplications((prev) => {
      const base = Object.fromEntries(applications.map((a) => [a.id, a.current_user_rated]));
      const locallyRated = Object.fromEntries(Object.entries(prev).filter(([, v]) => v));
      return { ...base, ...locallyRated };
    });
  }, [applications]);

  const filteredApplications = (applications ?? []).filter((a) =>
    portFilter === "all"
      ? true
      : a.applied_roles.some((r) => r.campaign_role_id === portFilter),
  );

  const upNext = filteredApplications.filter((a) => !ratedApplications[a.id]);
  const reviewed = filteredApplications.filter((a) => ratedApplications[a.id]);

  const selectedApp = filteredApplications.find((a) => a.id === selectedAppId);
  const selectedIndex = filteredApplications.findIndex((a) => a.id === selectedAppId);
  const totalCount = filteredApplications.length;

  const handleNext = () => {
    if (filteredApplications.length === 0) return;
    const nextIndex = selectedIndex === -1 ? 0 : (selectedIndex + 1) % filteredApplications.length;
    setSelectedAppId(filteredApplications[nextIndex].id);
  };

  const handleDecision = async (appId: string, roleId: string, status: ApplicationStatus) => {
    await updateApplicationRoleStatus(appId, roleId, status);
    await queryClient.invalidateQueries({ queryKey: [`${campaignId}-campaign-applications`] });
    await queryClient.invalidateQueries({ queryKey: [`${appId}-application-role-statuses`] });
  };

  return (
    <div className="flex flex-col gap-3 h-[calc(100vh-4rem)]">
      {/* Page header */}
      <div className="flex justify-between items-start shrink-0">
        <div>
          <Link
            href={`/dashboard/organisation/${orgId}/campaigns/${campaignId}`}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            {dict.common.back}
          </Link>
          <h1 className="text-2xl font-bold">
            {dict.dashboard.campaigns.review_applications}
          </h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{campaign?.name}</span>
            <span>
              {dateToString(campaign?.starts_at ?? "")} –{" "}
              {dateToString(campaign?.ends_at ?? "")}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleNext}>
            <Play className="w-3 h-3 mr-1 fill-current" />
            Next
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 min-h-0 rounded-lg border overflow-hidden mb-4">
        <ReviewSidebar
          upNext={upNext}
          reviewed={reviewed}
          selectedAppId={selectedAppId}
          onSelect={setSelectedAppId}
          campaignRoles={campaignRoles}
          portFilter={portFilter}
          onPortFilterChange={setPortFilter}
        />

        {/* Main panel */}
        <div className="flex-1 min-w-0 overflow-hidden">
          {selectedApp ? (
            <ApplicationPanel
              key={selectedApp.id}
              app={selectedApp}
              index={selectedIndex}
              total={totalCount}
              campaignId={campaignId}
              dict={dict}
              ratedApplications={ratedApplications}
              setRatedApplications={setRatedApplications}
              onDecision={handleDecision}
            />
          ) : (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Form />
                </EmptyMedia>
                <EmptyTitle>
                  {dict.dashboard.campaigns.application_review_page.no_application_selected}
                </EmptyTitle>
                <EmptyDescription>
                  {dict.dashboard.campaigns.application_review_page.click_on_application_to_view}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </div>
      </div>
    </div>
  );
}
