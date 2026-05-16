"use client";

import { useQuery } from "@tanstack/react-query";
import { getCampaign, getCampaignRoles, getCampaignAttachments, publishCampaign } from "@/models/campaign";
import { getRatingCategories, RatingCategory } from "@/models/rating";
import { Button } from "@/components/ui/button";
import { Copy, Pencil, Trash, Share, BookOpenCheck, FormIcon, FileText, BarChart, CircleCheck } from "lucide-react";
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
import { PublishCampaignDialog } from "./publish-campaign-dialog";



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

    const existingBannerSrc =
        campaign?.cover_image_url ||
        (campaign?.cover_image && /^https?:\/\//i.test(campaign.cover_image)
            ? campaign.cover_image
            : null) ||
        "/placeholder.svg";


    return (

        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8 animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
            <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
                <img className="w-full max-h-52 object-cover" src={existingBannerSrc} alt={`${campaign?.name} cover image`} />
                <div className="flex flex-col gap-3 border-t px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
                            {campaign?.name}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {dateToString(campaign?.starts_at ?? "")} - {dateToString(campaign?.ends_at ?? "")}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <ButtonGroup className="w-full sm:w-auto flex-col sm:flex-row gap-2 sm:gap-0 [&>*]:w-full sm:[&>*]:w-auto">
                            <Link href={`/dashboard/organisation/${campaign?.organisation_id}/campaigns/${campaignId}/review`} className="w-full sm:w-auto">
                                <Button className="w-full justify-center sm:w-auto">
                                    <BookOpenCheck className="w-4 h-4" /> {dict.dashboard.campaigns.review_applications}
                                </Button>
                            </Link>
                        </ButtonGroup>
                        <ButtonGroup className="w-full sm:w-auto flex-col sm:flex-row gap-2 sm:gap-0 [&>*]:w-full sm:[&>*]:w-auto">
                            <Link href={`/dashboard/organisation/${campaign?.organisation_id}/campaigns/${campaignId}/applications`} className="w-full sm:w-auto">
                                <Button className="w-full justify-center sm:w-auto">
                                    <BarChart className="w-4 h-4" /> {dict.dashboard.campaigns.application_summary}
                                </Button>
                            </Link>
                        </ButtonGroup>
                        <ButtonGroup className="w-full sm:w-auto flex-col sm:flex-row gap-2 sm:gap-0 [&>*]:w-full sm:[&>*]:w-auto">
                            <Link href={`/dashboard/organisation/${campaign?.organisation_id}/campaigns/${campaignId}/offers`} className="w-full sm:w-auto">
                                <Button className="w-full justify-center sm:w-auto">
                                    <CircleCheck className="w-4 h-4" /> View Offers
                                </Button>
                            </Link>
                        </ButtonGroup>
                        <ButtonGroup className="w-full sm:w-auto flex-col sm:flex-row gap-2 sm:gap-0 [&>*]:w-full sm:[&>*]:w-auto">
                            <CopyButton
                                value={`https://chaos.devsoc.app/campaign/${campaign?.organisation_slug}/${campaign?.campaign_slug}`}
                                className="w-full justify-center sm:w-auto"
                            >
                                <Share className="w-4 h-4" /> {dict.dashboard.campaigns.share_link}
                            </CopyButton>
                            <CopyButton value={campaignId} className="w-full justify-center sm:w-auto">
                                <Copy className="w-4 h-4" /> {dict.dashboard.campaigns.copy_campaign_id}
                            </CopyButton>
                        </ButtonGroup>
                        {userRole?.role === "Admin" && (
                            <>
                                <ButtonGroup className="w-full sm:w-auto flex-col sm:flex-row gap-2 sm:gap-0 [&>*]:w-full sm:[&>*]:w-auto">
                                    <Link href={`/dashboard/organisation/${orgId}/campaigns/${campaignId}/edit`} className="w-full sm:w-auto">
                                        <Button variant="outline" className="cursor-pointer w-full justify-center sm:w-auto">
                                            <Pencil className="w-4 h-4" /> {dict.dashboard.actions.edit}
                                        </Button>
                                    </Link>
                                    <Button variant="outline" className="cursor-pointer w-full justify-center sm:w-auto">
                                        <Trash className="w-4 h-4" /> {dict.dashboard.actions.delete}
                                    </Button>
                                </ButtonGroup>
                                {!campaign?.published && (
                                    <>
                                        <ButtonGroup className="w-full sm:w-auto flex-col sm:flex-row gap-2 sm:gap-0 [&>*]:w-full sm:[&>*]:w-auto">
                                            <Link href={`/dashboard/organisation/${orgId}/campaigns/${campaignId}/questions`} className="w-full sm:w-auto">
                                                <Button variant="outline" className="w-full justify-center sm:w-auto">
                                                    <FormIcon className="w-4 h-4" /> {dict.dashboard.campaigns.manage_questions}
                                                </Button>
                                            </Link>
                                        </ButtonGroup>
                                        <ButtonGroup className="w-full sm:w-auto flex-col sm:flex-row gap-2 sm:gap-0 [&>*]:w-full sm:[&>*]:w-auto">
                                            <PublishCampaignDialog
                                                onPublish={handlePublish}
                                                label={dict.dashboard.campaigns.publish}
                                                buttonClassName="w-full justify-center sm:w-auto"
                                            />
                                        </ButtonGroup>
                                    </>
                                )}
                            </>
                        )}

                    </div>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="flex flex-col gap-6">
                    <section className="rounded-xl border bg-white p-4 shadow-sm sm:p-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">{dict.common.roles}</h2>
                            <span className="text-xs text-muted-foreground">{roles?.length ?? 0}</span>
                        </div>
                        <div className="mt-4 overflow-hidden rounded-lg border">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted">
                                        <TableHead className="w-[160px]">{dict.common.name}</TableHead>
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
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    {role.min_available}
                                                    <span>-</span>
                                                    {role.max_available}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {roles?.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={2} className="text-center">
                                                <p className="text-sm text-gray-600">{dict.dashboard.campaigns.no_roles_available}</p>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </section>

                    <section className="rounded-xl border bg-white p-4 shadow-sm sm:p-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">{dict.common.rating_categories}</h2>
                            <span className="text-xs text-muted-foreground">{ratingCategories?.length ?? 0}</span>
                        </div>
                        <div className="mt-4 overflow-hidden rounded-lg border">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted">
                                        <TableHead className="w-[160px]">{dict.common.name}</TableHead>
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
                                    {ratingCategories?.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={2} className="text-center">
                                                <p className="text-sm text-gray-600">{dict.dashboard.campaigns.no_rating_categories_available}</p>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </section>
                </div>

                <div className="flex flex-col gap-6">
                    <section className="rounded-xl border bg-white p-4 shadow-sm sm:p-6">
                        <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <h2 className="text-lg font-semibold text-gray-900">{dict.common.description}</h2>
                        </div>
                        <div className="mt-3 text-sm leading-relaxed text-muted-foreground">
                            <div dangerouslySetInnerHTML={{ __html: descriptionHtmlState }} />
                        </div>
                    </section>

                    <section className="rounded-xl border bg-white p-4 shadow-sm sm:p-6">
                        <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <h2 className="text-lg font-semibold text-gray-900">{dict.common.attachments}</h2>
                        </div>
                        {attachments && attachments.length > 0 ? (
                            <div className="mt-3 space-y-2">
                                {attachments.map(attachment => (
                                    <a
                                        href={attachment.download_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 rounded-md border border-transparent bg-muted/40 px-3 py-2 text-sm text-blue-600 transition-colors hover:border-blue-200 hover:text-blue-800"
                                        key={attachment.id}
                                    >
                                        <FileText className="w-4 h-4" />
                                        <span className="truncate">{attachment.file_name}</span>
                                    </a>
                                ))}
                            </div>
                        ) : (
                            <p className="mt-3 text-sm text-muted-foreground">No attachments yet.</p>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
}
