"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ApplicationRatingSummary,
  ApplicationStatus,
  RoleStatus,
} from "@/models/application";
import { RatingCategory } from "@/models/rating";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { OfferStatus } from "@/models/offer";

const PALETTE = [
  "bg-tag-1 text-tag-1-foreground",
  "bg-tag-2 text-tag-2-foreground",
  "bg-tag-3 text-tag-3-foreground",
  "bg-tag-4 text-tag-4-foreground",
  "bg-tag-5 text-tag-5-foreground",
  "bg-tag-6 text-tag-6-foreground",
  "bg-tag-7 text-tag-7-foreground",
  "bg-tag-8 text-tag-8-foreground",
  "bg-tag-9 text-tag-9-foreground",
];

export function getColumns(
  dict: any,
  roleIdsToNames: Record<string, string>,
  roleOrder: string[],
  ratingCategories: RatingCategory[],
  onStatusChange: (
    applicationId: string,
    campaignRoleId: string,
    status: ApplicationStatus,
  ) => Promise<void>,
  filteredRoleId: string | null,
  roleStatusesMap: Record<string, RoleStatus[]>,
  mutatingItem: { appId: string; roleId: string } | null,
): ColumnDef<ApplicationRatingSummary>[] {
  const ratingColumns = ratingCategories.map((category) => {
    return {
      id: `rating-${category.id}`,
      header: category.name,
      cell: ({ row }) => {
        const ratings = row.original.ratings;
        const allCategoryRatings = ratings.flatMap((r) =>
          r.category_ratings.filter(
            (cr) => cr.campaign_rating_category_id === category.id && cr.rating,
          ),
        );
        console.log(allCategoryRatings);
        const averageRating =
          allCategoryRatings.length > 0
            ? (
                allCategoryRatings.reduce(
                  (sum, rating) => sum + rating.rating!,
                  0,
                ) / allCategoryRatings.length
              ).toFixed(2)
            : "-";

        return (
          <div className="flex items-center gap-2">
            <span>{averageRating}</span>
          </div>
        );
      },
    };
  }) as ColumnDef<ApplicationRatingSummary>[];

  const STATUS_COLOR_CLASSES: Record<OfferStatus, string> = {
    Draft: "text-foreground",
    Sent: "text-info-text",
    Accepted: "text-success-text",
    Declined: "text-destructive-text",
  };

  return [
    {
      header: dict.dashboard.campaigns.application_summary_page.applicant_name,
      accessorKey: "user_name",
      cell: ({ row }) => <span>{row.original.user_name}</span>,
    },
    {
      header: dict.common.email,
      accessorKey: "user_email",
    },
    {
      header: dict.common.roles,
      accessorKey: "applied_roles",
      filterFn: "arrIncludes",
      cell: ({ row }) => {
        const data = row.original;
        if (data.offer_role) {
          return <span>{data.offer_role}</span>;
        } else {
          const applied = (data.applied_roles as string[]) ?? [];

          const getColorForRole = (roleId: string) => {
            if (!roleId) return PALETTE[0];
            const idx = roleOrder.findIndex((r) => r === roleId);
            if (idx >= 0) return PALETTE[idx % PALETTE.length];
            const sum = Array.from(String(roleId)).reduce(
              (acc, ch) => acc + ch.charCodeAt(0),
              0,
            );
            return PALETTE[sum % PALETTE.length];
          };

          return (
            <div className="flex flex-wrap gap-2">
              {applied.map((roleId) => {
                const colorClass = getColorForRole(roleId);

                return (
                  <span
                    key={roleId}
                    className={cn(
                      `inline-flex items-center rounded px-3 py-1 text-sm font-medium cursor-default`,
                      colorClass,
                    )}
                    title={roleIdsToNames[roleId] ?? roleId}
                  >
                    {roleIdsToNames[roleId] ?? roleId}
                  </span>
                );
              })}
            </div>
          );
        }
      },
    },
    ...ratingColumns,
    {
      id: "average-rating",
      header: dict.dashboard.campaigns.application_summary_page.avg_rating,
      cell: ({ row }) => {
        const ratings = (row.original as any).ratings;
        if (!ratings || ratings.length === 0) return "-";

        const allCategoryRatings = ratings.flatMap((r: any) =>
          r.category_ratings
            .map((cr: any) => cr.rating)
            .filter((rating: any): rating is number => rating !== null),
        );

        const averageRating =
          allCategoryRatings.length > 0
            ? allCategoryRatings.reduce(
                (sum: number, rating: number) => sum + rating,
                0,
              ) / allCategoryRatings.length
            : 0;

        return (
          <div className="flex items-center gap-2">
            <span>{averageRating.toFixed(2)}</span>
          </div>
        );
      },
    },
    {
      id: "status",
      header:
        dict.dashboard.campaigns.application_summary_page.offer_status ??
        dict.dashboard.campaigns.application_summary_page.private_status ??
        "Status",
      cell: ({ row }) => {
        const data = row.original;
        if (data.offer_status) {
          return (
            <span
              className={STATUS_COLOR_CLASSES[data.offer_status as OfferStatus]}
            >
              {data.offer_status}
            </span>
          );
        }
        return (
          <StatusCell
            app={data as ApplicationRatingSummary}
            dict={dict}
            onPrivateStatusChange={onStatusChange}
            filteredRoleId={filteredRoleId}
            roleStatuses={roleStatusesMap[data.application_id] ?? []}
            isMutating={
              mutatingItem?.appId === data.application_id &&
              mutatingItem?.roleId === filteredRoleId
            }
          />
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        return (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8"
            onClick={() => row.toggleExpanded()}
          >
            {row.getIsExpanded() ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        );
      },
    },
  ];
}

function StatusCell({
  app,
  dict,
  onPrivateStatusChange,
  filteredRoleId,
  roleStatuses,
  isMutating,
}: {
  app: ApplicationRatingSummary;
  dict: any;
  onPrivateStatusChange: (
    applicationId: string,
    campaignRoleId: string,
    status: ApplicationStatus,
  ) => Promise<void>;
  filteredRoleId: string | null;
  roleStatuses: RoleStatus[];
  isMutating?: boolean;
}) {
  // TODO: Consider switching the colour used by interview
  const STATUS_BACKGROUND_COLORS: Record<ApplicationStatus, string> = {
    Successful: "bg-success-subtle border-success-border",
    Rejected: "bg-destructive-subtle border-destructive-border",
    Pending: "bg-muted border-input",
    Interview: "bg-muted border-input",
  };

  // No specific role is filtered, don't show the status dropdown
  if (!filteredRoleId) {
    const overall = app.private_status as ApplicationStatus;

    return (
      <span
        className={cn(
          "inline-flex items-center rounded px-4 py-2 text-sm font-semibold",
          STATUS_BACKGROUND_COLORS[overall],
        )}
      >
        {overall}
      </span>
    );
  }

  // Get the status for the filtered role
  const roleStatus = roleStatuses.find(
    (rs) => rs.campaign_role_id === filteredRoleId,
  );
  const status = (roleStatus?.status ?? "Pending") as
    | ApplicationStatus
    | "Pending";

  return (
    <div className="w-[140px]">
      <Select
        value={status}
        onValueChange={(v: ApplicationStatus) =>
          onPrivateStatusChange(app.application_id, filteredRoleId, v)
        }
        disabled={isMutating}
      >
        <SelectTrigger
          className={cn(
            STATUS_BACKGROUND_COLORS[status],
            isMutating && "opacity-50 cursor-not-allowed",
          )}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Successful" className="focus:bg-muted">
            {dict.dashboard.campaigns.application_summary_page.accept ??
              "Accept"}
          </SelectItem>
          <SelectItem value="Rejected" className="focus:bg-muted">
            {dict.dashboard.campaigns.application_summary_page.reject ??
              "Reject"}
          </SelectItem>
          <SelectItem value="Interview" className="focus:bg-muted">
            {dict.dashboard.campaigns.application_summary_page.interview ??
              "Interview"}
          </SelectItem>
          <SelectItem value="Pending" className="focus:bg-muted">
            {dict.dashboard.campaigns.application_summary_page.pending ??
              "Pending"}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
