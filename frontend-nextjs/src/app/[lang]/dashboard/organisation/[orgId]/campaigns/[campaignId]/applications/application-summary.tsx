"use client";

import { ApplicationSummaryDataTable } from "./data-table";
import { dateToString } from "@/lib/utils";
import {
    ApplicationRatingSummary,
    getApplicationRatingsSummary,
    updateApplicationPrivateStatus,
    ApplicationStatus,
} from "@/models/application";
import { queueCampaignOutcomeEmails } from "@/models/email";
import { getRatingCategories, RatingDetails } from "@/models/rating"
import { getCampaign, getCampaignRoles } from "@/models/campaign";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getColumns } from "./columns";
import { TableCell, TableRow } from "@/components/ui/table";
import { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { SendEmailsModal, type SendEmailsApplicant } from "./send-email-modal";
import { Send } from "lucide-react";

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
                        {rating.category_ratings.map((cr) => (
                            <TableCell key={cr.id}>
                                {cr.rating ?? "-"}
                            </TableCell>
                        ))}
                        <TableCell>
                            {rating.category_ratings.filter((cr) => cr.rating).map((cr) => cr.rating!).reduce((acc, rating) => acc! + rating!, 0) / rating.category_ratings.filter((cr) => cr.rating).length}
                        </TableCell>
                    </TableRow>
                ))
            }
        </>
    )
}

function toApplicant(
    app: ApplicationRatingSummary,
    roleIdsToNames: Record<string, string>
): SendEmailsApplicant {
    const applied = app.applied_roles ?? [];
    return {
        id: app.application_id,
        name: app.user_name,
        email: app.user_email,
        roles: applied.map((rid) => roleIdsToNames[rid] ?? rid),
    };
}

export default function ApplicationSummary({ campaignId, orgId, dict }: { campaignId: string, orgId: string, dict: any }) {
    const queryClient = useQueryClient();
    const [sendModalOpen, setSendModalOpen] = useState(false);

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

    const { data: ratingCategories } = useQuery({
        queryKey: [`${campaignId}-rating-categories`],
        queryFn: () => getRatingCategories(campaignId),
    });

    const { mutateAsync: mutatePrivateStatus } = useMutation({
        mutationFn: ({ applicationId, status }: { applicationId: string; status: ApplicationStatus }) =>
            updateApplicationPrivateStatus(applicationId, status),
        onSettled: () => {
            // inavlidate queries similar to how we do in the question component type beat so frontend is in sync w/ backend
            queryClient.invalidateQueries({ queryKey: [`${campaignId}-application-ratings-summary`] });
        },
    });

    const handlePrivateStatusChange = useCallback(
        async (applicationId: string, status: ApplicationStatus) => {
            await mutatePrivateStatus({ applicationId, status });
        },
        [mutatePrivateStatus]
    );

    const members = data ?? [];
    const acceptedApplicants = useMemo(
        () =>
            members
                .filter((a) => a.private_status === "Successful")
                .map((a) => toApplicant(a, roleIdsToNames)),
        [members, roleIdsToNames]
    );
    const rejectedApplicants = useMemo(
        () =>
            members
                .filter((a) => a.private_status === "Rejected")
                .map((a) => toApplicant(a, roleIdsToNames)),
        [members, roleIdsToNames]
    );

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
                <Button
                    variant="outline"
                    onClick={() => setSendModalOpen(true)}
                    className="gap-2"
                    disabled={acceptedApplicants.length === 0 && rejectedApplicants.length === 0}
                >
                    <Send className="size-4" />
                    {dict.dashboard.campaigns.send_outcome_emails ?? "Send outcome emails"}
                </Button>
            </div>
            <SendEmailsModal
                open={sendModalOpen}
                onOpenChange={setSendModalOpen}
                orgId={orgId}
                acceptedApplicants={acceptedApplicants}
                rejectedApplicants={rejectedApplicants}
                organisationName={campaign?.organisation_name}
                campaignName={campaign?.name}
                campaignEndsAt={campaign?.ends_at}
                onSend={async (payload) => {
                    await queueCampaignOutcomeEmails(campaignId, payload);
                }}
            />
            <div className="mt-2">
                <ApplicationSummaryDataTable
                    columns={getColumns(dict, roleIdsToNames, ratingCategories ?? [], handlePrivateStatusChange)}
                    data={data ?? []}
                    roles={roles ?? []}
                    dict={dict}
                    renderSubComponent={({ row }) => <RatingsShelf columns={getColumns(dict, roleIdsToNames, ratingCategories ?? [], handlePrivateStatusChange)} ratings={row.original.ratings} dict={dict}/>}
                />
            </div>
        </div>
    )
}