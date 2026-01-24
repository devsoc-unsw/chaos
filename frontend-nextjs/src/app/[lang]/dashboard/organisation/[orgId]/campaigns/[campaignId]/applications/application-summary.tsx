"use client";

import { ApplicationSummaryDataTable } from "./data-table";
import { dateToString } from "@/lib/utils";
import { ApplicationRatingSummary, getApplicationRatingsSummary, RatingDetails } from "@/models/application";
import { getCampaign, getCampaignRoles } from "@/models/campaign";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { getColumns } from "./columns";
import { TableCell, TableRow } from "@/components/ui/table";
import { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function RatingsShelf({ columns, ratings, applicationId, dict }: { columns: ColumnDef<ApplicationRatingSummary>[], ratings: RatingDetails[], applicationId: string, dict: any }) {
    if (!ratings || ratings.length === 0) {
        return (
            <TableRow key="no-ratings">
                <TableCell className="align-top text-center" colSpan={columns.length}>
                    <p className="text-xs text-gray-500">{dict.dashboard.campaigns.application_summary_page.no_ratings}</p>
                </TableCell>
            </TableRow>
        )
    }

    return (
        <>
            {
                ratings.map((rating) => (
                    <TableRow key={rating.id}>
                        <TableCell className="align-top" colSpan={4}>
                            <span className="font-medium">{rating.rater_name}</span>
                            <p className="text-sm text-gray-700">{rating.comment}</p>
                        </TableCell>
                        <TableCell className="align-top">{rating.rating.toFixed(2)}</TableCell>
                        <TableCell className="align-top">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                        <span className="sr-only">Open menu</span>
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuGroup>
                                        <DropdownMenuItem
                                            onClick={() => {
                                                console.log("Send offer clicked for application:", applicationId);
                                            }}
                                        >
                                            Send Offer
                                        </DropdownMenuItem>
                                    </DropdownMenuGroup>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                    </TableRow>
                ))
            }
        </>
    )
}

export default function ApplicationSummary({ campaignId, orgId, dict }: { campaignId: string, orgId: string, dict: any }) {
    const { data: campaign } = useQuery({
        queryKey: [`${campaignId}-campaign-details`],
        queryFn: () => getCampaign(campaignId),
    });

    const { data: roles } = useQuery({
        queryKey: [`${campaignId}-campaign-roles`],
        queryFn: () => getCampaignRoles(campaignId),
    });

    const roleIdsToNames = useMemo(() => {
        return roles?.reduce((acc, role) => {
            acc[role.id] = role.name;
            return acc;
        }, {} as Record<string, string>) ?? {};
    }, [roles]);

    const { data } = useQuery({
        queryKey: [`${campaignId}-application-ratings-summary`],
        queryFn: () => getApplicationRatingsSummary(campaignId),
    });

    return (
        <div>
            <div className="flex justify-between items-center">
                <div>
                    <Link href={`/dashboard/organisation/${orgId}/campaigns/${campaignId}`}>
                        <div className="flex items-center gap-1">
                            <ArrowLeft className="w-4 h-4" />
                            {dict.common.back}
                        </div>
                    </Link>
                    <h1 className="text-2xl font-bold">{dict.dashboard.campaigns.review_applications}</h1>
                    <h2 className="text-lg font-medium">{campaign?.name}</h2>
                    <p className="text-sm text-gray-500">{dateToString(campaign?.starts_at ?? "")} - {dateToString(campaign?.ends_at ?? "")}</p>
                </div>
            </div>
            <div className="mt-2">
                <ApplicationSummaryDataTable
                    columns={getColumns(dict, roleIdsToNames)}
                    data={data ?? []}
                    roles={roles ?? []}
                    dict={dict}
                    renderSubComponent={({ row }) => <RatingsShelf columns={getColumns(dict, roleIdsToNames)} ratings={row.original.ratings} applicationId={row.original.application_id} dict={dict} />}
                />
            </div>
        </div>
    )
}