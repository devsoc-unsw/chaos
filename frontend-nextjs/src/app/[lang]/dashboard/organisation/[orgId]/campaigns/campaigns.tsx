"use client";

import { getOrganisationUserRole, OrganisationCampaign } from "@/models/organisation";
import { getColumns } from "./columns";
import { useQuery } from "@tanstack/react-query";
import { getOrganisationCampaigns } from "@/models/organisation";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

import { useRouter } from "next/navigation";

export default function Campaigns({ orgId, dict }: { orgId: string, dict: any }) {
    const router = useRouter();

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
            <Button className="flex items-center justify-center gap-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 cursor-pointer" onClick={() => router.push(`/dashboard/organisation/${orgId}/campaigns/new`)}>
          <Plus className="w-10 h-10" />
          <p className="text-xl font-semibold">{dict.dashboard.actions.new}</p>
        </Button>
            <DataTable columns={columns} data={data ?? []} />
        </div>
    );
}