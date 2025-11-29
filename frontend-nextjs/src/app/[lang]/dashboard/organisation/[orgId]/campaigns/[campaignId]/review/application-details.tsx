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

export default function ApplicationDetailsComponent({ applicationId }: { applicationId: string | null }) {
    // const { data: application } = useQuery({
    //     queryKey: [`${applicationId}-application-details`],
    //     queryFn: () => getCampaignApplications(campaignId),
    // });

    return (
        <div className="flex flex-col gap-3">
            APPLICATION DETAILS for {applicationId}
        </div>
    );
}
