"use client";

import { getOrganisationUserRole, OrganisationCampaign } from "@/models/organisation";
import { getColumns } from "./columns";
import { useQuery } from "@tanstack/react-query";
import { getOrganisationCampaigns } from "@/models/organisation";
import { DataTable } from "@/components/ui/data-table";

export default function Campaigns({ orgId, dict }: { orgId: string, dict: any }) {
    const { data } = useQuery({
        queryKey: [`${orgId}-campaigns`],
        queryFn: () => getOrganisationCampaigns(orgId),
    });

    const { data: userRole } = useQuery({
        queryKey: [`${orgId}-organisation-user-role`],
        queryFn: () => getOrganisationUserRole(orgId),
    });

    const columns = getColumns(userRole ?? { role: "User" }, dict);

    return (
        <div>
            <h1 className="text-2xl font-bold my-2">{dict.common.campaigns}</h1>
            <DataTable columns={columns} data={data ?? []} />
        </div>
    );
}