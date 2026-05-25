"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ApplicationRatingSummary, ApplicationStatus, RoleStatus } from "@/models/application";
import { RatingCategory } from "@/models/rating";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { OfferStatus } from "@/models/offer";

function ApplicantLinkCell({ app }: { app: any }) {
  const pathname = usePathname();
  const base = pathname.endsWith("/applications")
    ? pathname
    : `${pathname}/applications`;

  return (
    <Link
      href={`${base}/${app.application_id}`}
      className="text-primary hover:underline"
    >
      {app.user_name}
    </Link>
  );
}

export function getColumns(
  dict: any,
  roleIdsToNames: Record<string, string>,
  ratingCategories: RatingCategory[],
  onStatusChange: (applicationId: string, campaignRoleId: string, status: ApplicationStatus) => Promise<void>,
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
        const allCategoryRatings = ratings.flatMap((r) => r.category_ratings.filter((cr) => cr.campaign_rating_category_id === category.id && cr.rating));
        console.log(allCategoryRatings);
        const averageRating = allCategoryRatings.length > 0
          ? (allCategoryRatings.reduce((sum, rating) => sum + rating.rating!, 0) / allCategoryRatings.length).toFixed(2)
          : "-";

        return (
          <div className="flex items-center gap-2">
            <span>{averageRating}</span>
          </div>
        );
      }
    }
  }) as ColumnDef<ApplicationRatingSummary>[];

  const STATUS_COLOR_CLASSES: Record<OfferStatus, string> = {
    "Draft": "text-gray-800",
    "Sent": "text-blue-800",
    "Accepted": "text-green-800",
    "Declined": "text-red-800",
  };

  return [
    {
      header: dict.dashboard.campaigns.application_summary_page.applicant_name,
      accessorKey: "user_name",
      cell: ({ row }) => <span>{row.original.user_name}</span>,
    },
    {
      header: dict.common.email,
      accessorKey: "user_email"
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
          return <span>{(data.applied_roles as string[]).map((roleId) => roleIdsToNames[roleId]).join(", ")}</span>;
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
          r.category_ratings.map((cr: any) => cr.rating).filter((rating: any): rating is number => rating !== null)
        );

        const averageRating = allCategoryRatings.length > 0
          ? allCategoryRatings.reduce((sum: number, rating: number) => sum + rating, 0) / allCategoryRatings.length
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
      header: dict.dashboard.campaigns.application_summary_page.offer_status ?? dict.dashboard.campaigns.application_summary_page.private_status ?? "Status",
      cell: ({ row }) => {
        const data = row.original;
        if (data.offer_status) {
          return <span className={STATUS_COLOR_CLASSES[data.offer_status as OfferStatus]}>{data.offer_status}</span>;
        }
        return (
          <PrivateStatusCell
            app={data as ApplicationRatingSummary}
            dict={dict}
            onPrivateStatusChange={onStatusChange}
            filteredRoleId={filteredRoleId}
            roleStatuses={roleStatusesMap[data.application_id] ?? []}
            isMutating={mutatingItem?.appId === data.application_id && mutatingItem?.roleId === filteredRoleId}
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
        )
      }
    }
  ];
}

function PrivateStatusCell({
  app,
  dict,
  onPrivateStatusChange,
  filteredRoleId,
  roleStatuses,
  isMutating,
}: {
  app: ApplicationRatingSummary;
  dict: any;
  onPrivateStatusChange: (applicationId: string, campaignRoleId: string, status: ApplicationStatus) => Promise<void>;
  filteredRoleId: string | null;
  roleStatuses: RoleStatus[];
  isMutating?: boolean;
}) {
  // TODO: Consider switching the colour used by interview
  const STATUS_BACKGROUND_COLORS: Record<ApplicationStatus, string> = {
    "Successful": "bg-green-100 border-green-300",
    "Rejected": "bg-red-100 border-red-300",
    "Pending": "bg-gray-100 border-gray-300",
    "Interview": "bg-gray-100 border-gray-300"
  };

  // No specific role is filtered, don't show the status dropdown
  if (!filteredRoleId) {
    return <span className="text-gray-500">-</span>;
  }

  // Get the status for the filtered role
  const roleStatus = roleStatuses.find((rs) => rs.campaign_role_id === filteredRoleId);
  const status = (roleStatus?.status ?? "Pending") as ApplicationStatus | "Pending";

  return (
    <div className="w-[140px]">
      <Select
        value={status}
        onValueChange={(v: ApplicationStatus) =>
          onPrivateStatusChange(app.application_id, filteredRoleId, v)
        }
        disabled={isMutating}
      >
        <SelectTrigger className={cn(STATUS_BACKGROUND_COLORS[status], isMutating && "opacity-50 cursor-not-allowed")}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Successful" className="focus:bg-muted">
            {dict.dashboard.campaigns.application_summary_page.accept ?? "Accept"}
          </SelectItem>
          <SelectItem value="Rejected" className="focus:bg-muted">
            {dict.dashboard.campaigns.application_summary_page.reject ?? "Reject"}
          </SelectItem>
          <SelectItem value="Interview" className="focus:bg-muted">
            {dict.dashboard.campaigns.application_summary_page.interview ?? "Interview"}
          </SelectItem>
          <SelectItem value="Pending" className="focus:bg-muted">
            {dict.dashboard.campaigns.application_summary_page.pending ?? "Pending"}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
