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
        <Button 
          variant="link" 
          className="h-auto p-0 font-normal -ml-2"
          onClick={() => toggleExpanded?.(application.application_id, !isOpen)}
        >
          <span className="underline font-semibold">{application.avg_rating.toFixed(1)}</span>
          {isOpen ? (
            <ChevronDown className="w-4 h-4 ml-1 inline" />
          ) : (
            <ChevronRight className="w-4 h-4 ml-1 inline" />
          )}
        </Button>
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