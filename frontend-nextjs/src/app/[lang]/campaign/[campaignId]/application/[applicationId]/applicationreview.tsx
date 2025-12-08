"use client";

import { useQuery } from "@tanstack/react-query";
import { getCampaign, getCampaignRoles } from "@/models/campaign";
import { getApplication } from "@/models/application";
import { useState, useEffect } from "react";
import { type DropResult } from "@hello-pangea/dnd";
import RoleSelector from "./roleselector";

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
  // —— Load hydrated campaign info ——
  const { data: campaign } = useQuery({
    queryKey: [`${campaignId}-campaign-info`],
    queryFn: () => getCampaign(campaignId),
  });

  // —— Load hydrated roles ——
  const { data: roles } = useQuery({
    queryKey: [`${campaignId}-campaign-roles`],
    queryFn: () => getCampaignRoles(campaignId),
  });

  // —— Load hydrated application ——
  const { data: application } = useQuery({
    queryKey: [`application-${applicationId}`],
    queryFn: () => getApplication(applicationId),
  });

  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);

  
  return (
    <div className="min-h-screen bg-gray-50 w-full">
      <div className="w-full mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {campaign?.name}
          </h1>
          <h3 className="text-xl text-gray-500">
            {formatDate(campaign?.starts_at)} - {formatDate(campaign?.ends_at)}
          </h3>
        </div>
        <div className="flex gap-8 w-full">
          <RoleSelector roles={roles} selectedRoleIds={selectedRoleIds} onChangeSelectedRoles={setSelectedRoleIds}/>
        </div>
      </div>
    </div>
  );
}