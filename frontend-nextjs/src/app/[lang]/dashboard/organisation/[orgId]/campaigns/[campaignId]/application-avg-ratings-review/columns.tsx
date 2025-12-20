"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { ApplicationStatus } from "@/models/application";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface AggregatedApplicationRating {
  application_id: string;
  campaign_role_id: string;
  campaign_role_name: string;
  user_name: string;
  user_email: string;
  status: ApplicationStatus;
  avg_rating: number;
  individual_ratings: Array<{
    rater_name: string;
    comment: string | null;
    rating: number;
    updated_at: string;
  }>;
}

export const createColumns = (dict: any): ColumnDef<AggregatedApplicationRating>[] => [
  {
    accessorKey: "user_name",
    header: dict.dashboard.campaigns.application_avg_ratings_table.applicant_name,
  },
  {
    accessorKey: "user_email",
    header: dict.common.email,
    enableColumnFilter: true,
  },
  {
    accessorKey: "campaign_role_id",
    header: dict.dashboard.members.role,
    enableColumnFilter: true,
    cell: ({ row }) => {
      return <span>{row.original.campaign_role_name}</span>;
    },
  },
  {
    accessorKey: "avg_rating",
    header: dict.dashboard.campaigns.application_avg_ratings_table.avg_rating,
    cell: ({ row, table }) => {
      const application = row.original;
      const isOpen = (table.options.meta as any)?.expandedRows?.[application.application_id] || false;
      const toggleExpanded = (table.options.meta as any)?.toggleExpanded;
      
      return (
        <div className="flex items-center gap-2 justify-left">
          <span>{application.avg_rating.toFixed(2)}</span>
          <Button 
            variant="ghost" 
            size="icon"
            className="h-6 w-6 p-0"
            onClick={() => toggleExpanded?.(application.application_id, !isOpen)}
          >
            {isOpen ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </Button>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: dict.common.status,
    cell: ({ row }) => {
      const value = row.getValue<ApplicationStatus>("status");
      return <span>{value}</span>;
    },
  }
];