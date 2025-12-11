"use client";

import { useQuery } from "@tanstack/react-query";
import { getCampaign, getCampaignRoles } from "@/models/campaign";
import { getApplication } from "@/models/application";
import { useState, useEffect } from "react";
import RoleSelector from "../../../../../../components/applicationanswer/roleselector";
import RoleTabs from "../../../../../../components/applicationanswer/roletabs";
import MainContent from "../../../../../../components/applicationanswer/maincontent";
interface ApplicationReviewProps {
  campaignId: string;
  applicationId: string;
  dict: any;
}

function formatDate(d: string | undefined) {
  if (d !== undefined) {
    return new Intl.DateTimeFormat("en-AU", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    }).format(new Date(d));
  }
  return '';
}

export default function ApplicationReview({
  campaignId,
  applicationId,
  dict,
}: ApplicationReviewProps) {
  const { data: campaign } = useQuery({
    queryKey: [`${campaignId}-campaign-info`],
    queryFn: () => getCampaign(campaignId),
  });

  const { data: roles } = useQuery({
    queryKey: [`${campaignId}-campaign-roles`],
    queryFn: () => getCampaignRoles(campaignId),
  });

  const { data: application } = useQuery({
    queryKey: [`application-${applicationId}`],
    queryFn: () => getApplication(applicationId),
  });

  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"general" | string>("general");

  const updateRoles = (nextSelectedRoles: string[]) => {
    setSelectedRoleIds(nextSelectedRoles)
  }

  return (
    <div className="min-h-screen bg-background w-full">
      <div className="w-full mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {campaign?.name}
          </h1>
          <h3 className="text-xl text-muted-foreground">
            {formatDate(campaign?.starts_at)} - {formatDate(campaign?.ends_at)}
          </h3>
        </div>
        <div></div>
        <div className="flex gap-8 w-full">
          <RoleSelector roles={roles} selectedRoleIds={selectedRoleIds} onChangeSelectedRoles={updateRoles} dict={dict}/>
          <div className="flex-1">
            <RoleTabs roles={roles} selectedRoleIds={selectedRoleIds} activeTab={activeTab} onChangeActiveTab={setActiveTab}/>
            <MainContent campaignId={campaignId} applicationId={applicationId} activeTab={activeTab} dict={dict}/>
          </div>
        </div>
      </div>
    </div>
  );
}