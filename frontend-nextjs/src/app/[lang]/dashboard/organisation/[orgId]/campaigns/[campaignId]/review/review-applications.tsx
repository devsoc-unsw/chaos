"use client";

import { useQuery } from "@tanstack/react-query";
import { getCampaign, getCampaignApplications, getCampaignRoles } from "@/models/campaign";
import { dateToString, cn } from "@/lib/utils";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ApplicationDetails } from "@/models/application";
import ApplicationDetailsComponent from "./application-details";
import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from "@/components/ui/empty"
import { ArrowLeft, Form } from "lucide-react";
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import Link from "next/link";
import ApplicationRatingForm from "./application-rating-form";
import { Separator } from "@/components/ui/separator";

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


    const [ratedApplications, setRatedApplications] = useState<Record<string, boolean>>(
        applications?.reduce((acc, a) => {
            acc[a.id] = a.current_user_rated;
            return acc;
        }, {} as Record<string, boolean>) ?? {}
    );

    return (
        <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center">
                <div>
                    <Link href={`/dashboard/organisation/${orgId}/campaigns/${campaignId}`}>
                        <div className="flex items-center gap-1">
                            <ArrowLeft className="w-4 h-4" />
                            {dict.common.back}
                        </div>
                    </Link>
                    <h1 className="text-2xl font-bold">{dict.dashboard.campaigns.review_applications}</h1>
                    <h2 className="text-lg font-medium">{campaign?.name}</h2>
                    <p className="text-sm text-gray-500">{dateToString(campaign?.starts_at ?? "")} - {dateToString(campaign?.ends_at ?? "")}</p>
                </div>
            </div>

            {/* Application review component */}
            <ResizablePanelGroup direction="horizontal">
                <div className="flex w-full h-[80vh] rounded-lg border overflow-hidden max-h-[80vh] mb-10">
                    <ResizablePanel defaultSize={20}>
                        <div className="h-full min-h-0">
                            <ScrollArea className="h-full">
                                {applications?.map((application: ApplicationDetails) => (
                                    <div
                                        key={application.id}
                                        className={cn(
                                            "p-2 border-b hover:cursor-pointer hover:bg-muted",
                                            selectedAppId === application.id && "bg-muted"
                                        )}
                                        onClick={() => setSelectedAppId(application.id)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs text-gray-500 font-mono">#{application.id}</p>
                                            {!ratedApplications[application.id] && (
                                                <Tooltip>
                                                    <TooltipTrigger>
                                                        <div className="rounded-full bg-primary w-2 h-2" />
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        {dict.dashboard.campaigns.application_review_page.application_not_rated}
                                                    </TooltipContent>
                                                </Tooltip>
                                            )}
                                        </div>
                                        <p className="text-md font-medium">{application.user.name}</p>
                                        <p className="text-sm text-gray-500">{application.applied_roles.map((role) => role.role_name).join(", ")}</p>
                                    </div>
                                ))}
                            </ScrollArea>
                        </div>
                    </ResizablePanel>
                    <ResizableHandle />
                    <ResizablePanel defaultSize={80}>
                        <div className="p-2 h-full">
                            {selectedAppId ? (
                                <>
                                    <ApplicationDetailsComponent applicationId={selectedAppId} campaignId={campaignId} dict={dict} ratedApplications={ratedApplications} setRatedApplications={setRatedApplications}>
                                        <ApplicationRatingForm applicationId={selectedAppId} campaignId={campaignId} dict={dict} />
                                    </ApplicationDetailsComponent>
                                </>
                            ) : (
                                <Empty>
                                    <EmptyHeader>
                                        <EmptyMedia variant="icon">
                                            <Form />
                                        </EmptyMedia>
                                        <EmptyTitle>{dict.dashboard.campaigns.application_review_page.no_application_selected}</EmptyTitle>
                                        <EmptyDescription>{dict.dashboard.campaigns.application_review_page.click_on_application_to_view}</EmptyDescription>
                                    </EmptyHeader>
                                </Empty>
                            )}
                        </div>
                    </ResizablePanel>
                </div>
            </ResizablePanelGroup>

        </div>
    );
}
