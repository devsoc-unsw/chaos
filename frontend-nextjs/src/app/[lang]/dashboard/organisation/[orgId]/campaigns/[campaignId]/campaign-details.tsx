"use client";

import { useQuery } from "@tanstack/react-query";
import { getCampaign, getCampaignRoles, getCampaignAttachments, publishCampaign } from "@/models/campaign";
import { getRatingCategories, RatingCategory } from "@/models/rating";
import { Button } from "@/components/ui/button";
import { Copy, Pencil, Trash, Share, BookOpenCheck, FormIcon, CircleCheck, FileText, BarChart } from "lucide-react";
import { ButtonGroup } from "@/components/ui/button-group";
import { cn, dateToString } from "@/lib/utils";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import Link from "next/link";
import { getOrganisationUserRole } from "@/models/organisation";
import { useEffect, useState } from "react";
import { RoleDetails } from "@/models/campaign";
import { remark } from "remark";
import html from "remark-html";
import CopyButton from "@/components/copy-button";

interface ClientRole extends RoleDetails {
    deleting: boolean;
    new: boolean;
}

interface ClientCategory extends RatingCategory {
    deleting: boolean;
    new: boolean;
}

interface CampaignDetailsData {
    campaignName?: string;
    clientRoles?: ClientRole[];
    description?: string;
    startsAt?: Date;
    endsAt?: Date;
    clientCategories?: ClientCategory[];
}

export type CampaignUpdateKeys = keyof CampaignDetailsData | "roleName" | "roleMinAvailable" | "roleMaxAvailable" | "categoryName";

function compareCampaignRoles(roles: RoleDetails[], clientRoles: ClientRole[]): boolean {
    if (roles.length !== clientRoles.length) return false;
    return roles.every(
        (role, index) => role.id === clientRoles[index].id &&
            role.name === clientRoles[index].name &&
            role.description === clientRoles[index].description &&
            role.min_available === clientRoles[index].min_available &&
            role.max_available === clientRoles[index].max_available &&
            role.finalised === clientRoles[index].finalised
    );
}

function compareRatingCategories(categories: RatingCategory[], clientCategories: ClientCategory[]): boolean {
    if (categories.length !== clientCategories.length) return false;
    return categories.every(
        (category, index) => category.id === clientCategories[index].id &&
            category.name === clientCategories[index].name
    );
}

export default function CampaignDetails({ campaignId, orgId, dict }: { campaignId: string, orgId: string, dict: any }) {
    const { data: campaign, refetch: refetchCampaign } = useQuery({
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

    const { data: ratingCategories } = useQuery({
        queryKey: [`${campaignId}-rating-categories`],
        queryFn: () => getRatingCategories(campaignId),
    });

    const { data: attachments } = useQuery({
        queryKey: [`${campaignId}-attachments`],
        queryFn: () => getCampaignAttachments(campaignId),
        retry: false,
    });

    const [hoveredDeleteIndex, setHoveredDeleteIndex] = useState<number | null>(null);
    const [descriptionHtmlState, setDescriptionHtmlState] = useState<string>("");
    const [hoveredDeleteCategoryIndex, setHoveredDeleteCategoryIndex] = useState<number | null>(null);

    const handlePublish = async () => {
        try {
            await publishCampaign(campaignId);
            await refetchCampaign();
        } catch (error) {
            console.error("Failed to publish campaign:", error);
        }
    };

    useEffect(() => {
        async function processMarkdown() {
            if (campaign?.description) {
                const processed = await remark()
                    .use(html)
                    .process(campaign.description);

                setDescriptionHtmlState(processed.toString());
            }
        }
        processMarkdown();
    }, [campaign?.description]);

    return (
        <div className="flex flex-col gap-3">
            <img className="w-full max-h-42 object-cover rounded-md" src={"/placeholder.svg"} alt={`${campaign?.name} cover image`} />
            <div className="flex items-center gap-2">
                <ButtonGroup>
                    <ButtonGroup>
                        <Link href={`/dashboard/organisation/${campaign?.organisation_id}/campaigns/${campaignId}/review`}>
                            <Button><BookOpenCheck className="w-4 h-4" /> {dict.dashboard.campaigns.review_applications}</Button>
                        </Link>
                    </ButtonGroup>
                    <ButtonGroup>
                        <Link href={`/dashboard/organisation/${campaign?.organisation_id}/campaigns/${campaignId}/applications`}>
                            <Button><BarChart className="w-4 h-4" /> {dict.dashboard.campaigns.application_summary}</Button>
                        </Link>
                    </ButtonGroup>
                    <ButtonGroup>
                        <CopyButton value={`https://chaos.devsoc.app/campaign/${campaign?.organisation_slug}/${campaign?.campaign_slug}`}>
                            <Share className="w-4 h-4" /> {dict.dashboard.campaigns.share_link}
                        </CopyButton>
                        <CopyButton value={campaignId}>
                            <Copy className="w-4 h-4" /> {dict.dashboard.campaigns.copy_campaign_id}
                        </CopyButton>
                    </ButtonGroup>
                    {userRole?.role === "Admin" && (
                        <ButtonGroup>
                            <Link href={`/dashboard/organisation/${orgId}/campaigns/${campaignId}/edit`}>
                                <Button variant="outline" className="cursor-pointer"><Pencil className="w-4 h-4" /> {dict.dashboard.actions.edit}</Button>
                            </Link>
                            <Button variant="outline" className="cursor-pointer"><Trash className="w-4 h-4" /> {dict.dashboard.actions.delete}</Button>
                        </ButtonGroup>
                    )}
                    {
                        !campaign?.published && (
                            <Link href={`/dashboard/organisation/${orgId}/campaigns/${campaignId}/questions`}>
                                <Button variant="outline"><FormIcon className="w-4 h-4" /> {dict.dashboard.campaigns.manage_questions}</Button>
                            </Link>
                        )
                    }
                    <ButtonGroup>
                        <Button variant="outline" onClick={handlePublish}>
                            <CircleCheck className="w-4 h-4 text-green-500" /> {dict.dashboard.campaigns.publish}
                        </Button>
                    </ButtonGroup>

                </ButtonGroup>
            </div>
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold">
                    {campaign?.name}
                </h1>
                {dateToString(campaign?.starts_at ?? "")} - {dateToString(campaign?.ends_at ?? "")}
            </div>

            <div className="max-w-[500px]">
                <h2 className="text-xl font-bold">{dict.common.roles}</h2>
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted">
                            <TableHead className="w-[100px]">{dict.common.name}</TableHead>
                            <TableHead>{dict.dashboard.campaigns.roles.number_of_positions}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {roles?.map((role, index) => (
                            <TableRow
                                key={role.id}
                                className={cn(
                                    "group transition-colors",
                                    hoveredDeleteIndex === index && "bg-red-50! hover:bg-red-50!"
                                )}
                            >
                                <TableCell className="font-medium">
                                    {role.name}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        {role.min_available}
                                        <span>-</span>
                                        {role.max_available}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {
                            roles?.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={2} className="text-center">
                                        <p className="text-sm text-gray-600">{dict.dashboard.campaigns.no_roles_available}</p>
                                    </TableCell>
                                </TableRow>
                            )
                        }
                    </TableBody>
                </Table>
            </div>

            <div className="max-w-[500px]">
                <h2 className="text-xl font-bold">{dict.common.rating_categories}</h2>
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted">
                            <TableHead className="w-[100px]">{dict.common.name}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {ratingCategories?.map((category, index) => (
                            <TableRow key={category.id} className={cn("group transition-colors", hoveredDeleteCategoryIndex === index && "bg-red-50! hover:bg-red-50!")}>
                                <TableCell className="font-medium">
                                    {category.name}
                                </TableCell>
                            </TableRow>
                        ))}
                        {
                            ratingCategories?.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={2} className="text-center">
                                        <p className="text-sm text-gray-600">{dict.dashboard.campaigns.no_rating_categories_available}</p>
                                    </TableCell>
                                </TableRow>
                            )
                        }
                    </TableBody>
                </Table>
            </div>

            <div>
                <h2 className="text-xl font-bold">{dict.common.description}</h2>
                <div dangerouslySetInnerHTML={{ __html: descriptionHtmlState }} />
            </div>
            {/* TODO: Add in the column roles */}
            <div>
                <h2 className="text-xl font-bold">{dict.common.attachments}</h2>
                {attachments && attachments.length > 0 && (
                    <div className="mt-3">
                        {attachments.map(attachment => (
                            <div className="flex items-center gap-2" key={attachment.id}>
                                <a
                                    href={attachment.download_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 hover:text-blue-800 underline flex items-center gap-2"
                                >
                                    <FileText className="w-4 h-4" />
                                    {attachment.file_name}
                                </a>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}