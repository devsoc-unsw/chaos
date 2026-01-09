"use client";

import { ApplicationSummaryDataTable } from "./data-table";
import { dateToString } from "@/lib/utils";
import { ApplicationRatingSummary, getApplicationRatingsSummary} from "@/models/application";
import { RatingDetails } from "@/models/rating"
import { getCampaign, getCampaignRoles } from "@/models/campaign";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getColumns } from "./columns";
import { TableCell, TableRow } from "@/components/ui/table";
import { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";

function RatingsShelf({ columns, ratings, dict }: { columns: ColumnDef<ApplicationRatingSummary>[], ratings: RatingDetails[], dict: any }) {
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
                        <TableCell className="align-top">
                            <div className="flex flex-col gap-1">
                                {rating.category_ratings.map((cr) => (
                                    <div key={cr.id} className="text-sm">
                                        <span className="font-medium">{cr.category_name}:</span> {cr.rating}
                                    </div>
                                ))}
                            </div>
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
                    renderSubComponent={({ row }) => <RatingsShelf columns={getColumns(dict, roleIdsToNames)} ratings={row.original.ratings} dict={dict} />}
                />
            </div>
        </div>
    )
}