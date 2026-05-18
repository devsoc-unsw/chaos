"use client";

import { ApplicationSummaryDataTable } from "./data-table";
import { cn, dateToString } from "@/lib/utils";
import {
  ApplicationRatingSummary,
  getApplicationRatingsSummary,
  updateApplicationPrivateStatus,
  ApplicationStatus,
  updateApplicationRoleStatus,
  RoleStatus,
  getApplicationRoleStatusesBatch,
} from "@/models/application";
import { getRatingCategories, RatingDetails } from "@/models/rating";
import { getCampaign, getCampaignRoles } from "@/models/campaign";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, X } from "lucide-react";
import Link from "next/link";
import { getColumns } from "./columns";
import { TableCell, TableRow } from "@/components/ui/table";
import { useMemo, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
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

// Filter state definition for dynamic view creation
interface FilterConfig {
  id: string;
  label: string;
  color?: string;
  hoverColor?: string;
  isSpecial?: boolean; // For "All" view which shows multiple tables
}

import {
  ColumnDef,
  ColumnFiltersState,
} from "@tanstack/react-table";
import { ApplicationSummaryDataTableAll } from "./data-table-all";
import { ApplicationSummaryDataTableOffered } from "./data-table-offered";
import { SendEmailsApplicant } from "./send-email-modal";

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
          <TableCell className="align-top" colSpan={3}>
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

  const dict = propsDict;

  const { data: campaign } = useQuery({
    queryKey: [`${campaignId}-campaign-details`],
    queryFn: () => getCampaign(campaignId),
  });

  const { data: roles } = useQuery({
    queryKey: [`${campaignId}-campaign-roles`],
    queryFn: () => getCampaignRoles(campaignId),
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
    queryFn: () => getApplicationRatingsSummary(campaignId),
  });

  const { data: ratingCategories } = useQuery({
    queryKey: [`${campaignId}-rating-categories`],
    queryFn: () => getRatingCategories(campaignId),
  });

  const { data: roleStatusesMap } = useQuery({
    queryKey: [`${campaignId}-application-role-statuses-batch`],
    queryFn: async () => {
      if (!data || data.length === 0) return {};
      return getApplicationRoleStatusesBatch(data.map((app) => app.application_id));
    },
    enabled: !!data && data.length > 0,
  });

  const { mutateAsync: mutatePrivateStatus } = useMutation({
    mutationFn: ({
      applicationId,
      campaignRoleId,
      status,
    }: {
      applicationId: string;
      campaignRoleId: string;
      status: ApplicationStatus;
    }) => updateApplicationRoleStatus(applicationId, campaignRoleId, status),
    onMutate: async ({ applicationId, campaignRoleId, status }) => {
      // Track that this item is being mutated (just for UI state, no cache updates)
      setMutatingItem({ appId: applicationId, roleId: campaignRoleId });
    },
    onError: (_err, _vars, context) => {
      // Clear the mutating item state
      setMutatingItem(null);
    },
    onSettled: () => {
      // Clear the mutating item state
      setMutatingItem(null);

      // After mutation completes, refetch both caches to get fresh data
      const summaryKey = [`${campaignId}-application-ratings-summary`];
      const roleStatusesKey = [`${campaignId}-application-role-statuses-batch`];

      queryClient.invalidateQueries({ queryKey: summaryKey });
      queryClient.invalidateQueries({ queryKey: roleStatusesKey });
    },
  });

  const handlePrivateStatusChange = useCallback(
    async (applicationId: string, campaignRoleId: string, status: ApplicationStatus) => {
      await mutatePrivateStatus({ applicationId, campaignRoleId, status });
    },
    [mutatePrivateStatus]
  );

  const allMembers = data ?? [];

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(
    []
  );

  // Track which item is currently being mutated to prevent flickering
  const [mutatingItem, setMutatingItem] = useState<{ appId: string; roleId: string } | null>(null);

  // Extract filtered role ID from columnFilters
  const filteredRoleId = useMemo(() => {
    const roleFilter = columnFilters.find((f) => f.id === "applied_roles")?.value as string | undefined;
    return (roleFilter && roleFilter !== "all") ? roleFilter : null;
  }, [columnFilters]);

  // Helper to get the status for an application in a specific role
  const getAppRoleStatus = useCallback(
    (appId: string, roleId: string | null): ApplicationStatus | null => {
      if (!roleId) return null;
      const roleStatuses = roleStatusesMap?.[appId];
      if (!roleStatuses) return null;
      return roleStatuses.find((rs) => rs.campaign_role_id === roleId)?.status ?? null;
    },
    [roleStatusesMap]
  );

  // Initialize default filter configurations
  const statusFilters: FilterConfig[] = [
    {
      id: "all",
      label: "All",
      color: "bg-gray-200",
      hoverColor: "hover:bg-gray-300",
      isSpecial: true,
    },
    {
      id: "rejected",
      label: "Rejected",
      color: "bg-red-100",
      hoverColor: "hover:bg-red-200",
    },
    {
      id: "successful",
      label: "Successful",
      color: "bg-green-100",
      hoverColor: "hover:bg-green-200",
    },
  ];

  const getFilterCount = useCallback(
    (filter: FilterConfig) => {
      // If no role is filtered, can't count by status filters other than "all"
      if (!filteredRoleId && filter.id !== "all") {
        return 0;
      }

      if (filter.id === "all") {
        return allMembers.filter((m) => m.applied_roles.includes(filteredRoleId!)).length;
      }

      // Count applications matching this status for the filtered role
      const targetStatus = filter.label as ApplicationStatus;
      const count = allMembers.filter((m) => {
        const status = getAppRoleStatus(m.application_id, filteredRoleId);
        return status === targetStatus;
      }).length;

      return count;
    },
    [allMembers, filteredRoleId, getAppRoleStatus]
  );

  const columns = useMemo(
    () =>
      getColumns(
        dict,
        roleIdsToNames,
        ratingCategories ?? [],
        handlePrivateStatusChange,
        filteredRoleId,
        roleStatusesMap ?? {},
        mutatingItem,
      ),
    [dict, roleIdsToNames, ratingCategories, handlePrivateStatusChange, filteredRoleId, roleStatusesMap, statusFilter, mutatingItem]
  );

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

  const acceptedApplicants = useMemo(
    () =>
      data?.filter((a) => a.private_status === "Successful")
        .map((a) => toApplicant(a, roleIdsToNames)),
    [data, roleIdsToNames]
  );
  const rejectedApplicants = useMemo(
    () =>
      data?.filter((a) => a.private_status === "Rejected")
        .map((a) => toApplicant(a, roleIdsToNames)),
    [data, roleIdsToNames]
  );

  return (
    <>
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

      <div className="mt-2">
        <div className="flex items-center py-4 gap-2">
          <Select
            value={
              (columnFilters.find((f) => f.id === "applied_roles")?.value as string) ??
              "all"
            }
            onValueChange={(value) =>
              setColumnFilters((prev) => {
                // Remove existing role filters
                const newFilters = prev.filter(
                  (f) => f.id !== "applied_roles" || f.value === "all"
                );
                // Add the new role filter
                if (value !== "all") {
                  newFilters.push({ id: "applied_roles", value });
                }
                return newFilters;
              })
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
          {statusFilters.map((filter) => (
            <div key={filter.id} className="relative">
              <ResultFilterButton
                className={
                  cn(filter.color, filter.hoverColor)
                }
                onClick={() => handleStatusFilter(filter.id)}
              >
                {filter.label} ({getFilterCount(filter)})
              </ResultFilterButton>
            </div>
          ))}
          <button
            onClick={() => { }}
            className="cursor-pointer ml-2"
            title="Add custom filter"
          >
            <Plus className="size-4" />
          </button>
        </div>

        <div>
          {statusFilter === "all" ? (
            <ApplicationSummaryDataTableAll
              columns={columns as ColumnDef<ApplicationRatingSummary>[]}
              data={data ?? []}
              dict={dict}
              setColumnFilters={setColumnFilters}
              columnFilters={columnFilters}
              orgId={orgId}
              campaignId={campaignId}
              renderSubComponent={renderSubComponent}
              acceptedApplicants={acceptedApplicants}
              rejectedApplicants={rejectedApplicants}
              filteredRoleId={filteredRoleId}
              getAppRoleStatus={getAppRoleStatus}
            />
          ) : statusFilter === "successful" ? (
            <ApplicationSummaryDataTableOffered
              columns={columns}
              data={data?.filter((m) => {
                if (!filteredRoleId) return false;
                const status = getAppRoleStatus(m.application_id, filteredRoleId);
                return status === "Successful";
              }) ?? []}
              dict={dict}
              setColumnFilters={setColumnFilters}
              columnFilters={columnFilters}
              orgId={orgId}
              campaignId={campaignId}
              renderSubComponent={renderSubComponent}
              acceptedApplicants={acceptedApplicants}
              rejectedApplicants={rejectedApplicants}
            />
          ) : (
            <ApplicationSummaryDataTable
              columns={columns}
              data={data?.filter((m) => {
                if (!filteredRoleId) return false;
                const targetStatus = statusFilters.find((f) => f.id === statusFilter)?.label as ApplicationStatus;
                const status = getAppRoleStatus(m.application_id, filteredRoleId);
                return status === targetStatus;
              }) ?? []}
              dict={dict}
              setColumnFilters={setColumnFilters}
              columnFilters={columnFilters}
              label={
                statusFilters.find((f) => f.id === statusFilter)?.label ||
                statusFilter
              }
              color={
                statusFilters.find((f) => f.id === statusFilter)?.color || ""
              }
              orgId={orgId}
              campaignId={campaignId}
              renderSubComponent={renderSubComponent}
              sendEmails={true}
              acceptedApplicants={acceptedApplicants}
              rejectedApplicants={rejectedApplicants}
            />)
          }
        </div>
      </div>
    </>
  );
}
