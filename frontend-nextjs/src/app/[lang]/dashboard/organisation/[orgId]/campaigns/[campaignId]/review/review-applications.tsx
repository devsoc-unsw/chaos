"use client";

import { useQuery } from "@tanstack/react-query";
import { getCampaign, getCampaignRoles } from "@/models/campaign";
import { Button } from "@/components/ui/button";
import { Copy, Pencil, Trash, Share, BookOpenCheck } from "lucide-react";
import { ButtonGroup } from "@/components/ui/button-group";
import { dateToString } from "@/lib/utils";
import Link from "next/link";
import { getOrganisationUserRole } from "@/models/organisation";

export default function ReviewCampaignApplications({ campaignId, orgId, dict }: { campaignId: string, orgId: string, dict: any }) {
    const { data: campaign } = useQuery({
        queryKey: [`${campaignId}-campaign-details`],
        queryFn: () => getCampaign(campaignId),
    });

    const { data: roles } = useQuery({
        queryKey: [`${campaignId}-campaign-roles`],
        queryFn: () => getCampaignRoles(campaignId),
    });

    return (
        <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold">{campaign?.name}</h1>
                <p className="text-sm text-gray-500">{dateToString(campaign?.starts_at ?? "")} - {dateToString(campaign?.ends_at ?? "")}</p>
            </div>
            
        </div>
    );
}