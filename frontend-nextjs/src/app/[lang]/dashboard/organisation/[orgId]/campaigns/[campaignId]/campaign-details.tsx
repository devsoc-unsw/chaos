"use client";

import { useQuery } from "@tanstack/react-query";
import { getCampaign, getCampaignRoles } from "@/models/campaign";
import { Button } from "@/components/ui/button";
import { Copy, Pencil, Trash, Share, BookOpenCheck } from "lucide-react";
import { ButtonGroup } from "@/components/ui/button-group";
import { dateToString } from "@/lib/utils";
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import Link from "next/link";
import { getOrganisationUserRole } from "@/models/organisation";

export default function CampaignDetails({ campaignId, descriptionHtml, orgId, dict }: { campaignId: string, descriptionHtml: string, orgId: string, dict: any }) {
    const { data: campaign } = useQuery({
        queryKey: [`${campaignId}-campaign-details`],
        queryFn: () => getCampaign(campaignId),
    });

    const { data: roles } = useQuery({
        queryKey: [`${campaignId}-campaign-roles`],
        queryFn: () => getCampaignRoles(campaignId),
    });

    const { data: userRole } = useQuery({
        queryKey: [`${orgId}-organisation-user-role`],
        queryFn: () => getOrganisationUserRole(orgId),
    });

    return (
        <div className="flex flex-col gap-3">
            <img className="w-full max-h-42 object-cover rounded-md" src={"/placeholder.svg"} alt={`${campaign?.name} cover image`} />
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold">{campaign?.name}</h1>
                <p className="text-sm text-gray-500">{dateToString(campaign?.starts_at ?? "")} - {dateToString(campaign?.ends_at ?? "")}</p>
            </div>
            <div className="flex items-center gap-2">
                <ButtonGroup>
                    <ButtonGroup>
                        <Link href={`/dashboard/organisation/${campaign?.organisation_id}/campaigns/${campaignId}/review`}>
                            <Button><BookOpenCheck className="w-4 h-4" /> {dict.dashboard.campaigns.review_applications}</Button>
                        </Link>
                    </ButtonGroup>
                    <ButtonGroup>
                        <Button variant="outline" onClick={() => navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_APP_URL}/campaign/${campaign?.organisation_slug}/${campaign?.campaign_slug}`)}>
                            <Share className="w-4 h-4" /> {dict.dashboard.campaigns.share_link}
                        </Button>
                    </ButtonGroup>
                    {userRole?.role === "Admin" && (
                    <ButtonGroup>
                        <Button variant="outline"><Pencil className="w-4 h-4" /> {dict.dashboard.actions.edit}</Button>
                        <Button variant="outline"><Trash className="w-4 h-4" /> {dict.dashboard.actions.delete}</Button>
                    </ButtonGroup>
                    )}
                    <ButtonGroup>
                        <Button variant="outline" onClick={() => navigator.clipboard.writeText(campaignId)}>
                            <Copy className="w-4 h-4" /> {dict.dashboard.campaigns.copy_campaign_id}
                        </Button>
                    </ButtonGroup>
                </ButtonGroup>
            </div>

            <div className="max-w-[500px]">
                <h2 className="text-xl font-bold">{dict.common.roles}</h2>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">{dict.common.name}</TableHead>
                            <TableHead>{dict.dashboard.campaigns.roles.number_of_positions}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {roles?.map((role) => (
                            <TableRow key={role.id}>
                                <TableCell className="font-medium">{role.name}</TableCell>
                                <TableCell>{role.min_available} - {role.max_available}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            <div>
                <h2 className="text-xl font-bold">{dict.common.description}</h2>
                <div dangerouslySetInnerHTML={{ __html: descriptionHtml }} />
            </div>
        </div>
    );
}