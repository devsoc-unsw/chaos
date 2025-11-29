"use client";

import { useQuery } from "@tanstack/react-query";
import { getOrganisationCampaigns } from "@/models/organisation";

export default function Campaigns({ orgId }: { orgId: string }) {
    const { data } = useQuery({
        queryKey: [`${orgId}-campaigns`],
        queryFn: () => getOrganisationCampaigns(orgId),
    });

    return (
        <div>
            {data?.map((campaign) => (
                <div key={campaign.id}>
                    <h1>{campaign.name}</h1>
                </div>
            ))}
        </div>
    );
}