"use client";

import { ColumnDef, Row } from "@tanstack/react-table";
import moment from "moment";

import { MoreHorizontal, ChevronDown, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ApplicationRatingSummary } from "@/models/application";
import { RatingCategory } from "@/models/rating";

export function getColumns(dict: any, roleIdsToNames: Record<string, string>, ratingCategories: RatingCategory[]): ColumnDef<ApplicationRatingSummary>[] {
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
        ...ratingColumns,
        {
            id: "average-rating",
            header: dict.dashboard.campaigns.application_summary_page.avg_rating,
            cell: ({ row }) => {
                const ratings = row.original.ratings;
                
                const allCategoryRatings = ratings.flatMap((r) => 
                    r.category_ratings.map((cr) => cr.rating).filter((rating): rating is number => rating !== null)
                );
                
                const averageRating = allCategoryRatings.length > 0
                    ? allCategoryRatings.reduce((sum, rating) => sum + rating, 0) / allCategoryRatings.length
                    : 0;

                return (
                    <div className="flex items-center gap-2">
                        <span>{averageRating.toFixed(2)}</span>
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