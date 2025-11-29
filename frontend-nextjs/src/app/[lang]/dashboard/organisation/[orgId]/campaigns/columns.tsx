"use client";

import { ColumnDef } from "@tanstack/react-table";
import { OrganisationCampaign } from "@/models/organisation";
import moment from "moment";

import { MoreHorizontal } from "lucide-react"
 
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link";
import { getDictionary } from "@/app/[lang]/dictionaries";

export function getColumns(dict: any): ColumnDef<OrganisationCampaign>[] {
    return [
    {
        header: dict.common.name,
        accessorKey: "name",
        cell: ({ row }) => {
            return <Link className="hover:underline" href={`/dashboard/organisation/${row.original.organisation_id}/campaigns/${row.original.id}`}>{row.original.name}</Link>;
        },
    },
    {
        header: dict.common.starts_at,
        accessorKey: "starts_at",
        cell: ({ row }) => {
            return <div>{moment(row.original.starts_at).format("DD/MM/YYYY HH:mm")}</div>;
        },
    },
    {
        header: dict.common.ends_at,
        accessorKey: "ends_at",
        cell: ({ row }) => {
            return <div>{moment(row.original.ends_at).format("DD/MM/YYYY HH:mm")}</div>;
        },
    },
    {
        header: dict.common.published,
        accessorKey: "published",
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const campaign = row.original;

            return <div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(campaign.id)}>
                            {dict.dashboard.campaigns.copy_campaign_id}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_APP_URL}/campaign/${campaign.organisation_slug}/${campaign.campaign_slug}`)}>
                            {dict.dashboard.campaigns.copy_campaign_link}
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            {dict.dashboard.campaigns.edit_campaign}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>;
        },
    },
    ];
}