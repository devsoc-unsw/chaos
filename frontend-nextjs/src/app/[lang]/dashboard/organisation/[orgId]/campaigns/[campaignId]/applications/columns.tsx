"use client";

import { ColumnDef, Row } from "@tanstack/react-table";
import { X, ChevronDown, ChevronRight } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ApplicationRatingSummary } from "@/models/application";
import { RatingCategory } from "@/models/rating";

export function getColumns(
    dict: any, roleIdsToNames: Record<string, string>, ratingCategories: RatingCategory[], 
    onAccept: (applicationId: string, appliedRoles: string[]) => void, onReject: (applicationId: string) => void,
    acceptedApplicationIds: Set<string>,
    rejectedApplicationIds: Set<string>,
    ActionsCell: React.ComponentType<{
        applicationId: string;
        appliedRoles: string[];
        isAccepted: boolean;
        isRejected: boolean;
        onAccept: (applicationId: string, appliedRoles: string[]) => void;
        onReject: (applicationId: string) => void;
    }>
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
    
    return [
        {
            id: "select",
            header: ({ table }) => (
                <Checkbox checked={table.getIsAllPageRowsSelected()} onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)} 
                    aria-label="Select all" disabled className="cursor-not-allowed opacity-50 border-gray-400 data-[state=checked]:border-gray-600" 
                />
            ),
            cell: ({ row }) => {
                const applicationId = row.original.application_id;
                const isAccepted = acceptedApplicationIds.has(applicationId);
                const isRejected = rejectedApplicationIds.has(applicationId);

                if (isRejected) {
                    return (
                        <div className="flex items-center justify-center w-4 h-4 border-2 border-red-500 rounded">
                            <X className="h-3 w-3 text-red-500" />
                        </div>
                    );
                }

                return (
                    <Checkbox 
                        checked={isAccepted} 
                        onCheckedChange={(value) => row.toggleSelected(!!value)}
                        aria-label="Select row" 
                        disabled 
                        className="cursor-not-allowed opacity-50 border-gray-400 data-[state=checked]:border-gray-600"
                    />
                );
            },
            enableSorting: false,
            enableHiding: false,
        },
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
                const applicationId = row.original.application_id;
                const isAccepted = acceptedApplicationIds.has(applicationId);
                const isRejected = rejectedApplicationIds.has(applicationId);
                
                return (
                    <div className="flex items-center gap-2">
                        <ActionsCell
                            applicationId={applicationId} appliedRoles={row.original.applied_roles}
                            isAccepted={isAccepted} isRejected={isRejected} 
                            onAccept={onAccept} onReject={onReject}
                        />
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
                    </div>
                );
            }
        }
    ];
}