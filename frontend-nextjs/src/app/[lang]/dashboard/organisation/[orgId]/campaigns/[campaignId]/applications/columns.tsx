"use client";

import { ColumnDef } from "@tanstack/react-table";
import { useEffect, useState } from "react";

import { ChevronDown, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ApplicationRatingSummary, ApplicationStatus } from "@/models/application";
import { RatingCategory } from "@/models/rating";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePathname } from "next/navigation";

function ApplicantLinkCell({ app }: { app: ApplicationRatingSummary }) {
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
    onPrivateStatusChange: (applicationId: string, status: ApplicationStatus) => Promise<void>
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
            header: dict.dashboard.campaigns.application_summary_page.applicant_name,
            accessorKey: "user_name",
            cell: ({ row }) => <ApplicantLinkCell app={row.original} />,
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
            id: "private-status",
            header: dict.dashboard.campaigns.application_summary_page.private_status ?? "Status",
            cell: ({ row }) => (
                <PrivateStatusCell
                    app={row.original}
                    dict={dict}
                    onPrivateStatusChange={onPrivateStatusChange}
                />
            ),
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
}: {
    app: ApplicationRatingSummary;
    dict: any;
    onPrivateStatusChange: (applicationId: string, status: ApplicationStatus) => Promise<void>;
}) {
    const [value, setValue] = useState<ApplicationStatus>(app.private_status ?? "Pending");
    console.log(app);
    useEffect(() => {
        setValue(app.private_status ?? "Pending");
    }, [app.private_status]);

    const handleChange = async (newValue: ApplicationStatus) => {
        setValue(newValue);
        await onPrivateStatusChange(app.application_id, newValue);
    };

    return (
        <div className="w-[140px]">
            <Select
                value={value}
                onValueChange={(v: ApplicationStatus) => handleChange(v)}
            >
                <SelectTrigger>
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="Successful" className="focus:bg-muted">
                        {dict.dashboard.campaigns.application_summary_page.accept ?? "Accept"}
                    </SelectItem>
                    <SelectItem value="Rejected" className="focus:bg-muted">
                        {dict.dashboard.campaigns.application_summary_page.reject ?? "Reject"}
                    </SelectItem>
                    <SelectItem value="Pending" className="focus:bg-muted">
                        {dict.dashboard.campaigns.application_summary_page.pending ?? "Pending"}
                    </SelectItem>
                </SelectContent>
            </Select>
        </div>
    );
}