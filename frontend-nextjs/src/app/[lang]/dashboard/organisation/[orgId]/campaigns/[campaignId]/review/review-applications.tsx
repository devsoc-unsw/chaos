"use client";

import { useQuery } from "@tanstack/react-query";
import { getCampaign, getCampaignApplications, getCampaignRoles } from "@/models/campaign";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Search, Filter } from "lucide-react";
import { dateToString, cn } from "@/lib/utils";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ApplicationDetails } from "@/models/campaign";
import ApplicationDetailsComponent from "./application-details";

export default function ReviewCampaignApplications({ campaignId, orgId, dict }: { campaignId: string, orgId: string, dict: any }) {
    const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
    const [roleFilter, setRoleFilter] = useState<string | null>(null);

    const { data: campaign } = useQuery({
        queryKey: [`${campaignId}-campaign-details`],
        queryFn: () => getCampaign(campaignId),
    });

    const { data: roles } = useQuery({
        queryKey: [`${campaignId}-campaign-roles`],
        queryFn: () => getCampaignRoles(campaignId),
    });

    const { data: applications } = useQuery({
        queryKey: [`${campaignId}-campaign-applications`],
        queryFn: () => getCampaignApplications(campaignId),
    });

    return (
        <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">{campaign?.name}</h1>
                    <p className="text-sm text-gray-500">{dateToString(campaign?.starts_at ?? "")} - {dateToString(campaign?.ends_at ?? "")}</p>
                </div>
            </div>

            <div className="flex w-full min-h-[50vh] rounded-lg border">
                <div className="w-1/3 border-r">
                    <ScrollArea className="h-full">
                        {applications?.map((application: ApplicationDetails) => (
                            <div
                                key={application.id}
                                className="p-2 border-b hover:cursor-pointer hover:bg-muted"
                                onClick={() => setSelectedAppId(application.id)}
                            >
                                <p className="text-xs text-gray-500 font-mono">#{application.id}</p>
                                <p className="text-md font-medium">{application.user.name}</p>
                                <p className="text-sm text-gray-500">{application.applied_roles.map((role) => role.role_name).join(", ")}</p>
                            </div>
                        ))}
                    </ScrollArea>
                </div>
                <div className="w-full p-2">
                    <ApplicationDetailsComponent applicationId={selectedAppId} />
                </div>
            </div>

        </div>
    );
}
