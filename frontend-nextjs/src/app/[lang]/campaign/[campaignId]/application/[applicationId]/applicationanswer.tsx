"use client";

import { useQuery } from "@tanstack/react-query";
import { getCampaign, getCampaignRoles } from "@/models/campaign";
import { getUnsubmittedApplication } from "@/models/application";
import { updateApplicationRoles } from "@/models/answer";
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
    queryFn: () => getUnsubmittedApplication(applicationId),
  });

  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"general" | string>("general");

  const buildUpdatedRolesPayload = (orderedIds: string[]) => {
    if (!application?.applied_roles || application.applied_roles.length === 0) {
      return orderedIds.map((campaignRoleId, index) => ({
        campaign_role_id: campaignRoleId,
        preference: index
      }));
    }

    return orderedIds.map((campaignRoleId, index) => {
      const existing = application.applied_roles.find(
        r => String(r.campaign_role_id) === String(campaignRoleId)
      );

      if (!existing) {
        return {
          campaign_role_id: campaignRoleId,
          preference: index
        };
      }

      return {
        campaign_role_id: existing.campaign_role_id,
        preference: index
      };
    });
  };

  const updateRoles = async (nextSelectedRoles: string[]) => {
    setSelectedRoleIds(nextSelectedRoles)
    console.log(nextSelectedRoles)
    try {
      const payload = {
        roles: buildUpdatedRolesPayload(nextSelectedRoles),
      };
      console.log(payload.roles)
      await updateApplicationRoles(applicationId, payload.roles);

    } catch (err) {
      console.error("Failed to update roles:", err);
    }
  }

  useEffect(() => {
    if (application?.applied_roles) {
      setSelectedRoleIds(
        [...application.applied_roles]
          .sort((a, b) => a.preference - b.preference)
          .map(r => String(r.campaign_role_id))
      );
    }
  }, [application]);

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
          <RoleSelector roles={roles} selectedRoleIds={selectedRoleIds} onChangeSelectedRoles={updateRoles} applicationId={applicationId} dict={dict}/>
          <div className="flex-1">
            <RoleTabs roles={roles} selectedRoleIds={selectedRoleIds} activeTab={activeTab} onChangeActiveTab={setActiveTab}/>
            <MainContent campaignId={campaignId} applicationId={applicationId} activeTab={activeTab} dict={dict}/>
          </div>
        </div>
      </div>
    </div>
  );
}