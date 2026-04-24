"use client";

import { ApplicationSummaryDataTable } from "./data-table";
import { cn, dateToString } from "@/lib/utils";
import {
  ApplicationRatingSummary,
  getApplicationRatingsSummary,
  updateApplicationPrivateStatus,
  ApplicationStatus,
} from "@/models/application";
import { queueCampaignOutcomeEmails } from "@/models/email";
import { getRatingCategories, RatingDetails } from "@/models/rating";
import { getCampaign, getCampaignRoles } from "@/models/campaign";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";
import { getColumns } from "./columns";
import { TableCell, TableRow } from "@/components/ui/table";
import { useMemo, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { SendEmailsModal, type SendEmailsApplicant } from "./send-email-modal";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  getCoreRowModel,
  getFilteredRowModel,
  getExpandedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  mockCampaign,
  mockRoles,
  mockRatingCategories,
  mockApplicationRatingSummary,
  mockDict,
} from "@/mocks/application-summary.mock";
import { ApplicationSummaryDataTableAll } from "./data-table-all";
import { ApplicationSummaryDataTableOffered } from "./data-table-offered";

// Toggle this flag to use mock data instead of API calls
const USE_MOCK_DATA = true;

export function RatingsShelf({
  columns,
  ratings,
  dict,
}: {
  columns: ColumnDef<ApplicationRatingSummary>[];
  ratings: RatingDetails[];
  dict: any;
}) {
  if (!ratings || ratings.length === 0) {
    return (
      <TableRow key="no-ratings">
        <TableCell className="align-top text-center" colSpan={columns.length}>
          <p className="text-xs text-gray-500">
            {dict.dashboard.campaigns.application_summary_page.no_ratings}
          </p>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <>
      {ratings.map((rating) => (
        <TableRow key={rating.id}>
          <TableCell className="align-top" colSpan={4}>
            <span className="font-medium">{rating.rater_name}</span>
            <p className="text-sm text-gray-700">{rating.comment}</p>
          </TableCell>
          {rating.category_ratings.map((cr) => (
            <TableCell key={cr.id}>{cr.rating ?? "-"}</TableCell>
          ))}
          <TableCell>
            {rating.category_ratings
              .filter((cr) => cr.rating)
              .map((cr) => cr.rating!)
              .reduce((acc, rating) => acc! + rating!, 0) /
              rating.category_ratings.filter((cr) => cr.rating).length}
          </TableCell>
        </TableRow>
      ))}
    </>
  );
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
    roleIds: applied,
    roles: applied.map((rid) => roleIdsToNames[rid] ?? rid),
  };
}

function ResultFilterButton({
  children,
  className,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <Button
      variant="outline"
      className={cn("ml-2 w-24", className)}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

export default function ApplicationSummary({
  campaignId,
  orgId,
  dict: propsDict,
}: {
  campaignId: string;
  orgId: string;
  dict: any;
}) {
  const queryClient = useQueryClient();
  const [sendModalOpen, setSendModalOpen] = useState(false);

  const dict = propsDict;

  const { data: campaign } = useQuery({
    queryKey: [`${campaignId}-campaign-details`],
    queryFn: () =>
      USE_MOCK_DATA ? Promise.resolve(mockCampaign) : getCampaign(campaignId),
  });

  const { data: roles } = useQuery({
    queryKey: [`${campaignId}-campaign-roles`],
    queryFn: () =>
      USE_MOCK_DATA ? Promise.resolve(mockRoles) : getCampaignRoles(campaignId),
  });

  const roleIdsToNames = useMemo(() => {
    return (
      roles?.reduce((acc, role) => {
        acc[role.id] = role.name;
        return acc;
      }, {} as Record<string, string>) ?? {}
    );
  }, [roles]);

  const { data } = useQuery({
    queryKey: [`${campaignId}-application-ratings-summary`],
    queryFn: () =>
      USE_MOCK_DATA
        ? Promise.resolve(mockApplicationRatingSummary)
        : getApplicationRatingsSummary(campaignId),
  });

  const { data: ratingCategories } = useQuery({
    queryKey: [`${campaignId}-rating-categories`],
    queryFn: () =>
      USE_MOCK_DATA
        ? Promise.resolve(mockRatingCategories)
        : getRatingCategories(campaignId),
  });

  const { mutateAsync: mutatePrivateStatus } = useMutation({
    mutationFn: ({
      applicationId,
      status,
    }: {
      applicationId: string;
      status: ApplicationStatus;
    }) => updateApplicationPrivateStatus(applicationId, status),
    onSettled: () => {
      // inavlidate queries similar to how we do in the question component type beat so frontend is in sync w/ backend
      queryClient.invalidateQueries({
        queryKey: [`${campaignId}-application-ratings-summary`],
      });
    },
  });

  const handlePrivateStatusChange = useCallback(
    async (applicationId: string, status: ApplicationStatus) => {
      await mutatePrivateStatus({ applicationId, status });
    },
    [mutatePrivateStatus]
  );

  const [statusFilter, setStatusFilter] = useState<string>(
    "All"
  );

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
  };

  const allMembers = data ?? [];
  const pendingMembers = useMemo(
    () => allMembers.filter((a) => a.private_status === "Pending"),
    [allMembers]
  );

  const nonPendingMembers = useMemo(
    () => allMembers.filter((a) => a.private_status !== "Pending"),
    [allMembers]
  );

  const members = useMemo(() => {
    if (statusFilter === "All") return allMembers;
    return allMembers.filter((a) => a.private_status === statusFilter);
  }, [allMembers, statusFilter]);

  const acceptedApplicants = useMemo(
    () =>
      allMembers
        .filter((a) => a.private_status === "Successful")
        .map((a) => toApplicant(a, roleIdsToNames)),
    [allMembers, roleIdsToNames]
  );
  const rejectedApplicants = useMemo(
    () =>
      allMembers
        .filter((a) => a.private_status === "Rejected")
        .map((a) => toApplicant(a, roleIdsToNames)),
    [allMembers, roleIdsToNames]
  );

  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );

  const columns = useMemo(
    () =>
      getColumns(
        dict,
        roleIdsToNames,
        ratingCategories ?? [],
        handlePrivateStatusChange
      ),
    [dict, roleIdsToNames, ratingCategories, handlePrivateStatusChange]
  );

  const table = useReactTable({
    data: members,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: () => true,
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      columnFilters,
    },
  });

  const tablePending = useReactTable({
    data: pendingMembers,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: () => true,
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      columnFilters,
    },
  });

  const tableNonPending = useReactTable({
    data: nonPendingMembers,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: () => true,
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      columnFilters,
    },
  });

  const tableColorsMap: Record<string, string> = {
    Successful: "bg-green-100",
    Rejected: "bg-red-100",
  }

  return (
    <div>

      <div>
        <Link
          href={`/dashboard/organisation/${orgId}/campaigns/${campaignId}`}
        >
          <div className="flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" />
            {dict.common.back}
          </div>
        </Link>
        <h1 className="text-2xl font-bold">
          {dict.dashboard.campaigns.review_applications}
        </h1>
        <h2 className="text-lg font-medium">{campaign?.name}</h2>
        <p className="text-sm text-gray-500">
          {dateToString(campaign?.starts_at ?? "")} -{" "}
          {dateToString(campaign?.ends_at ?? "")}
        </p>
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
        <div className="flex items-center py-4 gap-2">
          <Select
            value={
              (table.getColumn("applied_roles")?.getFilterValue() as string) ??
              "all"
            }
            onValueChange={(value) =>
              table
                .getColumn("applied_roles")
                ?.setFilterValue(value === "all" ? undefined : value)
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue
                placeholder={
                  dict.dashboard.campaigns.application_summary_page
                    .filter_by_role
                }
              />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>{dict.common.roles}</SelectLabel>
                <SelectItem value="all">
                  {dict.dashboard.campaigns.application_summary_page.all_roles}
                </SelectItem>
                {roles?.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {/* Result Filter Button group */}
        <div className="mb-4 flex items-center">
          <ResultFilterButton onClick={() => handleStatusFilter("All")}>
            All ({allMembers.length})  
          </ResultFilterButton>
          <ResultFilterButton
            className="bg-red-500/15 hover:bg-red-500/20"
            onClick={() => handleStatusFilter("Rejected")}
          >
            Rejected ({rejectedApplicants.length})
          </ResultFilterButton>
          <ResultFilterButton
            className="bg-green-500/15 hover:bg-green-500/20"
            onClick={() => handleStatusFilter("Successful")}
          >
            Offer ({acceptedApplicants.length})
          </ResultFilterButton>
          <button className="cursor-pointer ml-4">
            <Plus className="size-4" />
          </button>
        </div>

        <div>
          {statusFilter === "All" ? (
            <ApplicationSummaryDataTableAll 
              tablePending={tablePending}
              tableNonPending={tableNonPending}
              dict={dict}
              setSendModalOpen={setSendModalOpen}
              roleIdsToNames={roleIdsToNames}
              ratingCategories={ratingCategories ?? []}
              handlePrivateStatusChange={handlePrivateStatusChange}
              acceptedApplicants={acceptedApplicants}
              rejectedApplicants={rejectedApplicants}
            />
          ) : statusFilter === "Successful" ? (
            <ApplicationSummaryDataTableOffered 
              table={table}
              dict={dict}
              setSendModalOpen={setSendModalOpen}
              roleIdsToNames={roleIdsToNames}
              ratingCategories={ratingCategories ?? []}
              handlePrivateStatusChange={handlePrivateStatusChange}
              acceptedApplicants={acceptedApplicants}
              rejectedApplicants={rejectedApplicants}
            />
          ) : (
            <ApplicationSummaryDataTable
              label={statusFilter}
              color={tableColorsMap[statusFilter]}
              table={table}
              dict={dict}
              setSendModalOpen={setSendModalOpen}
              acceptedApplicants={acceptedApplicants}
              rejectedApplicants={rejectedApplicants}
              orgId={orgId}
              campaignId={campaignId}
              renderSubComponent={({ row }) => (
                <RatingsShelf
                  columns={getColumns(
                    dict,
                    roleIdsToNames,
                    ratingCategories ?? [],
                    handlePrivateStatusChange
                  )}
                  ratings={row.original.ratings}
                  dict={dict}
                />
              )}
            />
          )}
        </div>
      </div>
    </div>
  );
}
