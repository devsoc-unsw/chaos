"use client";

import { ApplicationSummaryDataTable } from "./data-table";
import { dateToString } from "@/lib/utils";
import { ApplicationRatingSummary, getApplicationRatingsSummary} from "@/models/application";
import { getRatingCategories, RatingDetails } from "@/models/rating"
import { getCampaign, getCampaignRoles } from "@/models/campaign";
import { getOrganisationEmailTemplates } from "@/models/email";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { getColumns } from "./columns";
import { TableCell, TableRow } from "@/components/ui/table";
import { ColumnDef } from "@tanstack/react-table";
import { useMemo, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function RatingsShelf({ columns, ratings, applicationId, dict }: { columns: ColumnDef<ApplicationRatingSummary>[], ratings: RatingDetails[], applicationId: string, dict: any }) {
    if (!ratings || ratings.length === 0) {
        return (
            <TableRow key="no-ratings">
                <TableCell className="align-top text-center" colSpan={columns.length}>
                    <p className="text-xs text-gray-500">{dict.dashboard.campaigns.application_summary_page.no_ratings}</p>
                </TableCell>
            </TableRow>
        )
    }

    return (
        <>
            {
                ratings.map((rating) => (
                    <TableRow key={rating.id}>
                        <TableCell className="align-top" colSpan={5}>
                            <span className="font-medium">{rating.rater_name}</span>
                            <p className="text-sm text-gray-700">{rating.comment}</p>
                        </TableCell>
                        {rating.category_ratings.map((cr) => (
                            <TableCell key={cr.id} className="align-middle">
                                {cr.rating ?? "-"}
                            </TableCell>
                        ))}
                        <TableCell className="align-middle ">
                            {rating.category_ratings.filter((cr) => cr.rating).length > 0
                                ? (rating.category_ratings.filter((cr) => cr.rating).map((cr) => cr.rating!).reduce((acc, rating) => acc! + rating!, 0) / rating.category_ratings.filter((cr) => cr.rating).length)
                                : "-"}
                        </TableCell>
                    </TableRow>
                ))
            }
        </>
    )
}

// Actions cell for Acception and Rejection
export function ActionsCell({ 
    applicationId, appliedRoles, isAccepted, isRejected, onAccept, onReject
}: {
    applicationId: string;
    appliedRoles: string[];
    isAccepted: boolean;
    isRejected: boolean;
    onAccept: (applicationId: string, appliedRoles: string[]) => void;
    onReject: (applicationId: string) => void;
}) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuGroup>
                    {isAccepted ? (
                        <DropdownMenuItem
                            onClick={() => {
                                onAccept(applicationId, appliedRoles);
                            }}
                        >
                            Undo Accept
                        </DropdownMenuItem>
                    ) : isRejected ? (
                        <DropdownMenuItem
                            onClick={() => {
                                onReject(applicationId);
                            }}
                        >
                            Undo Reject
                        </DropdownMenuItem>
                    ) : (
                        <>
                            <DropdownMenuItem
                                onClick={() => {
                                    onAccept(applicationId, appliedRoles);
                                }}
                            >
                                Accept
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => {
                                    onReject(applicationId);
                                }}
                            >
                                Reject
                            </DropdownMenuItem>
                        </>
                    )}
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

// Select Role Dialog for multiple roles applied
export function SelectRoleDialog({ 
    open,onOpenChange,appliedRoles, roleIdsToNames, onConfirm, dict 
}: { 
    open: boolean;
    onOpenChange: (open: boolean) => void;
    appliedRoles: string[];
    roleIdsToNames: Record<string, string>;
    onConfirm: (selectedRoleId: string) => void;
    dict: any; 
}) {
    const [selectedRole, setSelectedRole] = useState<string>(appliedRoles[0] || "");

    const handleConfirm = () => {
        if (selectedRole) {
            onConfirm(selectedRole);
            onOpenChange(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Select Role for Offer</DialogTitle>
                    <DialogDescription>
                        This applicant applied for multiple roles. Please select which role to accept.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <RadioGroup value={selectedRole} onValueChange={setSelectedRole}>
                        {appliedRoles.map((roleId) => (
                            <div key={roleId} className="flex items-center space-x-2 py-2">
                                <RadioGroupItem value={roleId} id={`role-${roleId}`} className="border-2 border-gray-900"/>
                                <Label
                                    htmlFor={`role-${roleId}`}
                                    className="font-normal cursor-pointer flex-1"
                                >
                                    {roleIdsToNames[roleId]}
                                </Label>
                            </div>
                        ))}
                    </RadioGroup>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button onClick={handleConfirm} disabled={!selectedRole}>
                        Send Offer
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function ApplicationSummary({ campaignId, orgId, dict }: { campaignId: string, orgId: string, dict: any }) {
    const [acceptedApplications, setAcceptedApplications] = useState<Map<string, string>>(new Map());
    const [rejectedApplicationIds, setRejectedApplicationIds] = useState<Set<string>>(new Set());
    const [dialogOpen, setDialogOpen] = useState(false);
    const [currentApplication, setCurrentApplication] = useState<{
        id: string;
        applied_roles: string[];
    } | null>(null);

    const acceptedApplicationIds = useMemo(() => new Set(acceptedApplications.keys()), [acceptedApplications]);
    
    const { data: campaign } = useQuery({
        queryKey: [`${campaignId}-campaign-details`],
        queryFn: () => getCampaign(campaignId),
    });

    const { data: roles } = useQuery({
        queryKey: [`${campaignId}-campaign-roles`],
        queryFn: () => getCampaignRoles(campaignId),
    });

    const roleIdsToNames = useMemo(() => {
        return roles?.reduce((acc, role) => {
            acc[role.id] = role.name;
            return acc;
        }, {} as Record<string, string>) ?? {};
    }, [roles]);

    const { data } = useQuery({
        queryKey: [`${campaignId}-application-ratings-summary`],
        queryFn: () => getApplicationRatingsSummary(campaignId),
    });

    const { data: ratingCategories } = useQuery({
        queryKey: [`${campaignId}-rating-categories`],
        queryFn: () => getRatingCategories(campaignId),
    });

    const { data: emailTemplates } = useQuery({
        queryKey: [`${orgId}-email-templates`],
        queryFn: () => getOrganisationEmailTemplates(orgId),
    });

    // Current way to differentiate an email template of "Offer"
    // No Reject yet
    // Could also make use of "Interview status"
    const offerTemplate = useMemo(() => {
        const template = emailTemplates?.find(template => 
            template.name.toLowerCase().includes("offer")
        );
        
        // Validation of email template organisation_id matches the campaign organisation_id
        if (template && campaign && template.organisation_id !== campaign.organisation_id) {
            console.error('Email template organisation_id does not match campaign organisation_id');
            return undefined;
        }
        
        return template;
    }, [emailTemplates, campaign]);
    const handleAccept = useCallback((applicationId: string, appliedRoles: string[]) => {
        // If already accepted, we can undo the acception
        if (acceptedApplicationIds.has(applicationId)) {
            setAcceptedApplications(prev => {
                const newMap = new Map(prev);
                newMap.delete(applicationId);
                return newMap;
            });
            return;
        }

        // Remove from rejected if it was there
        setRejectedApplicationIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(applicationId);
            return newSet;
        });

        // Multiple roles applied we show dialog to select which role to accept
        if (appliedRoles.length > 1) {
            setCurrentApplication({ id: applicationId, applied_roles: appliedRoles });
            setDialogOpen(true);
        } else {
            // Single role applied, no popup needed - store the role ID
            setAcceptedApplications(prev => new Map(prev).set(applicationId, appliedRoles[0]));
            
            if (offerTemplate) {
                console.log(`Accepted application ${applicationId} with role ${appliedRoles[0]} and email template ${offerTemplate.id} (${offerTemplate.name})`);
            }
        }
    }, [acceptedApplicationIds, offerTemplate]);

    const handleReject = useCallback((applicationId: string) => {
        // If already rejected, we can undo the rejection
        if (rejectedApplicationIds.has(applicationId)) {
            setRejectedApplicationIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(applicationId);
                return newSet;
            });
            console.log(`Unrejected application ${applicationId}`);
            return;
        }

        // Remove from accepted
        setAcceptedApplications(prev => {
            const newMap = new Map(prev);
            newMap.delete(applicationId);
            return newMap;
        });

        // Add to rejected
        setRejectedApplicationIds(prev => {
            const newSet = new Set(prev);
            newSet.add(applicationId);
            return newSet;
        });
    }, [rejectedApplicationIds, acceptedApplications]);

    const handleRoleConfirm = useCallback((selectedRoleId: string) => {
        if (currentApplication) {
            // Store the selected role ID along with the application ID
            setAcceptedApplications(prev => new Map(prev).set(currentApplication.id, selectedRoleId));
            
            if (offerTemplate) {
                console.log(`Accepted application ${currentApplication.id} with role ${selectedRoleId} and email template ${offerTemplate.id} (${offerTemplate.name})`);
            }
        }
    }, [currentApplication, offerTemplate]);

    return (
        <div>
            <div className="flex justify-between items-center">
                <div>
                    <Link href={`/dashboard/organisation/${orgId}/campaigns/${campaignId}`}>
                        <div className="flex items-center gap-1">
                            <ArrowLeft className="w-4 h-4" />
                            {dict.common.back}
                        </div>
                    </Link>
                    <h1 className="text-2xl font-bold">{dict.dashboard.campaigns.review_applications}</h1>
                    <h2 className="text-lg font-medium">{campaign?.name}</h2>
                    <p className="text-sm text-gray-500">{dateToString(campaign?.starts_at ?? "")} - {dateToString(campaign?.ends_at ?? "")}</p>
                </div>
            </div>
            <div className="mt-2">
                <ApplicationSummaryDataTable
                    columns={getColumns(dict, roleIdsToNames, ratingCategories ?? [], handleAccept, handleReject, acceptedApplicationIds, rejectedApplicationIds, ActionsCell)}
                    data={data ?? []}
                    roles={roles ?? []}
                    dict={dict}
                    acceptedApplicationIds={acceptedApplicationIds}
                    acceptedApplications={acceptedApplications}
                    rejectedApplicationIds={rejectedApplicationIds}
                    offerTemplateId={offerTemplate?.id}
                    renderSubComponent={({ row }) => <RatingsShelf columns={getColumns(dict, roleIdsToNames, ratingCategories ?? [], handleAccept, handleReject, acceptedApplicationIds, rejectedApplicationIds, ActionsCell)} ratings={row.original.ratings} applicationId={row.original.application_id} dict={dict} />}
                />
            </div>
            {currentApplication && (
                <SelectRoleDialog open={dialogOpen} onOpenChange={setDialogOpen}
                    appliedRoles={currentApplication.applied_roles} roleIdsToNames={roleIdsToNames} 
                    onConfirm={handleRoleConfirm} dict={dict}
                />
            )}
        </div>
    )
}