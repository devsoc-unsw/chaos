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
import { ArrowLeft, Plus, X } from "lucide-react";
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

/// Filter state definition for dynamic view creation
interface FilterConfig {
  id: string;
  label: string;
  predicate: (app: ApplicationRatingSummary) => boolean;
  color?: string;
  hoverColor?: string;
  isSpecial?: boolean; // For "All" view which shows multiple tables
}
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

  const allMembers = data ?? [];

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [customFilters, setCustomFilters] = useState<FilterConfig[]>([]);

  /// Initialize default filter configurations
  const defaultFilters = useMemo<FilterConfig[]>(() => [
    {
      id: "all",
      label: "All",
      predicate: () => true,
      isSpecial: true,
    },
    {
      id: "rejected",
      label: "Rejected",
      predicate: (a) => a.private_status === "Rejected",
      color: "bg-red-100",
      hoverColor: "hover:bg-red-200",
    },
    {
      id: "successful",
      label: "Successful",
      predicate: (a) => a.private_status === "Successful",
      color: "bg-green-100",
      hoverColor: "hover:bg-green-200",
    },
  ], []);

  /// All available filters (default + custom)
  const allFilters = useMemo<FilterConfig[]>(
    () => [...defaultFilters, ...customFilters],
    [defaultFilters, customFilters]
  );

  /// Get count for a specific filter
  const getFilterCount = useCallback(
    (filter: FilterConfig) => allMembers.filter(filter.predicate).length,
    [allMembers]
  );

  /// Get filtered data for current status
  const filteredMembers = useMemo(() => {
    const currentFilter = allFilters.find((f) => f.id === statusFilter);
    if (!currentFilter) return allMembers;
    return allMembers.filter(currentFilter.predicate);
  }, [allMembers, statusFilter, allFilters]);

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

  /// Create current filter's main table
  const currentTable = useReactTable({
    data: filteredMembers,
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

  /// For "All" view, create separate tables for pending/non-pending
  const tablePending = useReactTable({
    data: allMembers.filter((a) => a.private_status === "Pending"),
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
    data: allMembers.filter((a) => a.private_status !== "Pending"),
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

  /// Handle adding a new custom filter
  const handleAddFilter = useCallback(() => {
    const newFilter: FilterConfig = {
      id: `custom-${Date.now()}`,
      label: `Filter ${customFilters.length + 1}`,
      predicate: (a) => a.private_status === "Pending", // Default predicate
      color: "bg-blue-100",
      hoverColor: "hover:bg-blue-200",
    };
    setCustomFilters((prev) => [...prev, newFilter]);
  }, [customFilters.length]);

  /// Handle removing a custom filter
  const handleRemoveFilter = useCallback((filterId: string) => {
    setCustomFilters((prev) => prev.filter((f) => f.id !== filterId));
    if (statusFilter === filterId) {
      setStatusFilter("all");
    }
  }, [statusFilter]);

  const handleStatusFilter = useCallback(
    (status: string) => {
      setStatusFilter(status);
    },
    []
  );


  const renderSubComponent = useCallback(
    ({ row }: { row: any }) => (
      <RatingsShelf
        columns={columns}
        ratings={row.original.ratings}
        dict={dict}
      />
    ),
    [columns, dict, statusFilter]
  );

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
              (currentTable.getColumn("applied_roles")?.getFilterValue() as string) ??
              "all"
            }
            onValueChange={(value) =>
              currentTable
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
        <div className="mb-4 flex items-center flex-wrap gap-2">
          {allFilters.map((filter) => (
            <div key={filter.id} className="relative">
              <ResultFilterButton
                className={
                    cn(filter.color, filter.hoverColor)
                }
                onClick={() => handleStatusFilter(filter.id)}
              >
                {filter.label} ({getFilterCount(filter)})
              </ResultFilterButton>
              {!filter.isSpecial && customFilters.some((f) => f.id === filter.id) && (
                <button
                  onClick={() => handleRemoveFilter(filter.id)}
                  className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 text-white hover:bg-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
          <button
            onClick={handleAddFilter}
            className="cursor-pointer ml-2"
            title="Add custom filter"
          >
            <Plus className="size-4" />
          </button>
        </div>

        <div>
          {statusFilter === "all" ? (
            <ApplicationSummaryDataTableAll
              tablePending={tablePending}
              tableNonPending={tableNonPending}
              dict={dict}
              setSendModalOpen={setSendModalOpen}
              renderSubComponent={renderSubComponent}
              acceptedApplicants={acceptedApplicants}
              rejectedApplicants={rejectedApplicants}
            />
          ) : (
            <ApplicationSummaryDataTable
              label={
                allFilters.find((f) => f.id === statusFilter)?.label ||
                statusFilter
              }
              color={
                allFilters.find((f) => f.id === statusFilter)?.color || ""
              }
              table={currentTable}
              dict={dict}
              setSendModalOpen={setSendModalOpen}
              acceptedApplicants={acceptedApplicants}
              rejectedApplicants={rejectedApplicants}
              orgId={orgId}
              campaignId={campaignId}
              renderSubComponent={renderSubComponent}
            />
          )}
        </div>
      </div>
    </div>
  );
}
