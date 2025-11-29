"use client";

import { OrganisationCampaign } from "@/models/organisation";
import { getColumns } from "./columns";
import { useQuery } from "@tanstack/react-query";
import { getOrganisationCampaigns } from "@/models/organisation";
import { DataTable } from "@/components/ui/data-table";

export default function Campaigns({ orgId, dict }: { orgId: string, dict: any }) {
    const { data } = useQuery({
        queryKey: [`${orgId}-campaigns`],
        queryFn: () => getOrganisationCampaigns(orgId),
    });

    const columns = getColumns(dict);

    return (
        <div>
            <DataTable columns={columns} data={data ?? []} />
        </div>
    );
}