"use client";

import { getOrganisationUserRole, OrganisationCampaign } from "@/models/organisation";
import { getColumns } from "./columns";
import { useQuery } from "@tanstack/react-query";
import { getOrganisationCampaigns } from "@/models/organisation";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

import { useRouter } from "next/navigation";
import Link from "next/link";

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
            <div className="flex items-center justify-between my-2">
                <h1 className="text-2xl font-bold">{dict.common.campaigns}</h1>
                <Link href={`/dashboard/organisation/${orgId}/campaigns/new`}>
                    <Button variant="ghost" className="mr-1"><Plus className="w-8 h-8" /> </Button>
                </Link>
            </div>
            <DataTable columns={columns} data={data ?? []} />
        </div>
    );
}