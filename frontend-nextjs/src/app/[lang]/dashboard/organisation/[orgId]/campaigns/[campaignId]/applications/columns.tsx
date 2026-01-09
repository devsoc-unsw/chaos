"use client";

import { ColumnDef, Row } from "@tanstack/react-table";
import moment from "moment";

import { MoreHorizontal, ChevronDown, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ApplicationRatingSummary } from "@/models/application";

export function getColumns(dict: any, roleIdsToNames: Record<string, string>): ColumnDef<ApplicationRatingSummary>[] {
    return [
        {
            header: "ID",
            accessorKey: "application_id",
        },
        {
            header: dict.dashboard.campaigns.application_summary_page.applicant_name,
            accessorKey: "user_name",
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
                return <span>{row.original.applied_roles.map((roleId) => roleIdsToNames[roleId]).join(", ")}</span>;
            },
        },
        {
            id: "ratings",
            header: dict.dashboard.campaigns.application_summary_page.avg_rating,
            cell: ({ row }) => {
                const ratings = row.original.ratings;

                return (
                    <div className="flex flex-col gap-1">
                        {ratings.map((rating) => (
                            <div key={rating.id} className="text-sm">
                                <span className="font-medium">{rating.rater_name}</span>
                                <div className="flex gap-2 flex-wrap">
                                    {rating.category_ratings.map((cr) => (
                                        <span key={cr.id} className="text-xs bg-gray-100 px-2 py-1 rounded">
                                            {cr.category_name}: {cr.rating}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
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