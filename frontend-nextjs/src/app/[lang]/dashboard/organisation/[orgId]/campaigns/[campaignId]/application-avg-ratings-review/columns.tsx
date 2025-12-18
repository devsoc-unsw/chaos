"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { UserAvgApplicationRating, ApplicationStatus } from "@/models/application";

export const columns: ColumnDef<UserAvgApplicationRating>[] = [
//   {
//     accessorKey: "application_id",
//     header: "Application ID",
//   },
{
    accessorKey: "user_name",
    header: "Name",
  },
  {
    accessorKey: "user_email",
    header: "Email",
    enableColumnFilter: true,
  },
  {
    accessorKey: "campaign_role_id",
    header: "Role",
    enableColumnFilter: true,
    cell: ({ row }) => {
      return <span>{row.original.campaign_role_name}</span>;
    },
  },
  {
    accessorKey: "avg_rating",
    // accessorKey: "application_id",
    header: "Avg rating",
    cell: ({ row }) => {
      const value = row.getValue<number | null>("avg_rating");
      return <span>{value != null ? value.toFixed(2) : "-"}</span>;
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const value = row.getValue<ApplicationStatus>("status");
      return <span>{value}</span>;
    },
  }
];