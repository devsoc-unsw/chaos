"use client";

import { getCampaign } from "@/models/campaign";
import { useQuery } from "@tanstack/react-query";

export default function Unpublished({
    campaignId,
    dict,
}: {
    campaignId: string;
    dict: any;
}){
    const { data: campaign } = useQuery({
        queryKey: [`${campaignId}-campaign-info`],
        queryFn: () => getCampaign(campaignId),
    });

    return (
        <div className="min-h-screen w-full flex items-center justify-center">
            The campaign {campaign?.name} is not published yet.
        </div>
    )
}