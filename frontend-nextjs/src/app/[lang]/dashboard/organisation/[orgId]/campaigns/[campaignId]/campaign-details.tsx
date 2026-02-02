"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CampaignUpdate, createCampaignRole, getCampaign, getCampaignRoles, updateCampaign, getCampaignAttachments, uploadAttachments, deleteCampaignAttachment } from "@/models/campaign";
import { getRatingCategories, createCategory, updateCategory, deleteCategory, RatingCategory } from "@/models/rating";
import { Button } from "@/components/ui/button";
import { Copy, Pencil, Trash, Share, BookOpenCheck, Check, Plus, FormIcon, CircleCheck, Upload, X, FileText, BarChart } from "lucide-react";
import { ButtonGroup } from "@/components/ui/button-group";
import { cn } from "@/lib/utils";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import Link from "next/link";
import { getOrganisationUserRole } from "@/models/organisation";
import EditDetail from "./edit-detail";
import { useEffect, useState } from "react";
import { RoleDetails } from "@/models/campaign";
import CampaignDates from "./campaign-dates";
import { RoleUpdate, deleteRole, updateRole } from "@/models/role";
import { toast } from "sonner";
import { remark } from "remark";
import html from "remark-html";
import CopyButton from "@/components/copy-button";
import { uploadFile } from "@/models/file";

interface ClientRole extends RoleDetails {
    deleting: boolean;
    new: boolean;
}

interface ClientCategory extends RatingCategory {
    deleting: boolean;
    new: boolean;
}

interface CampaignDetailsData {
    campaignName?: string;
    clientRoles?: ClientRole[];
    description?: string;
    startsAt?: Date;
    endsAt?: Date;
    clientCategories?: ClientCategory[];
}

export type CampaignUpdateKeys = keyof CampaignDetailsData | "roleName" | "roleMinAvailable" | "roleMaxAvailable" | "categoryName";

function compareCampaignRoles(roles: RoleDetails[], clientRoles: ClientRole[]): boolean {
    if (roles.length !== clientRoles.length) return false;
    return roles.every(
        (role, index) => role.id === clientRoles[index].id && 
                    role.name === clientRoles[index].name && 
                    role.description === clientRoles[index].description && 
                    role.min_available === clientRoles[index].min_available && 
                    role.max_available === clientRoles[index].max_available && 
                    role.finalised === clientRoles[index].finalised
        );
}

function compareRatingCategories(categories: RatingCategory[], clientCategories: ClientCategory[]): boolean {
    if (categories.length !== clientCategories.length) return false;
    return categories.every(
        (category, index) => category.id === clientCategories[index].id && 
                    category.name === clientCategories[index].name
        );
}

export default function CampaignDetails({ campaignId, orgId, dict }: { campaignId: string, orgId: string, dict: any }) {
    const [editingMode, setEditingMode] = useState(false);
    const queryClient = useQueryClient();

    const { data: campaign } = useQuery({
        queryKey: [`${campaignId}-campaign-details`],
        queryFn: () => getCampaign(campaignId),
    });

    const { mutateAsync: mutateCampaignDetails } = useMutation({
        mutationFn: (data: CampaignUpdate) => updateCampaign(campaignId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`${campaignId}-campaign-details`] });
        },
        onError: () => {
            queryClient.invalidateQueries({ queryKey: [`${campaignId}-campaign-details`] });
        },
    });

    const { data: roles } = useQuery({
        queryKey: [`${campaignId}-campaign-roles`],
        queryFn: () => getCampaignRoles(campaignId),
    });

    const { mutateAsync: mutateCreateCampaignRole } = useMutation({
        mutationFn: (data: RoleDetails) => createCampaignRole(campaignId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`${campaignId}-campaign-roles`] });
        },
        onError: () => {
            queryClient.invalidateQueries({ queryKey: [`${campaignId}-campaign-roles`] });
        },
    });

    const { mutateAsync: mutateUpdateRole } = useMutation({
        mutationFn: ({roleId, data}: {roleId: string, data: RoleUpdate}) => updateRole(roleId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`${campaignId}-campaign-roles`] });
        },
        onError: () => {
            queryClient.invalidateQueries({ queryKey: [`${campaignId}-campaign-roles`] });
        },
    });

    const { mutateAsync: mutateDeleteRole } = useMutation({
        mutationFn: (roleId: string) => deleteRole(roleId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`${campaignId}-campaign-roles`] });
        },
        onError: () => {
            queryClient.invalidateQueries({ queryKey: [`${campaignId}-campaign-roles`] });
        },
    });

    const { data: userRole } = useQuery({
        queryKey: [`${orgId}-organisation-user-role`],
        queryFn: () => getOrganisationUserRole(orgId),
    });

    const { data: ratingCategories } = useQuery({
        queryKey: [`${campaignId}-rating-categories`],
        queryFn: () => getRatingCategories(campaignId),
    });

    const { mutateAsync: mutateCreateCategory } = useMutation({
        mutationFn: (name: string) => createCategory(name, campaignId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`${campaignId}-rating-categories`] });
        },
        onError: () => {
            queryClient.invalidateQueries({ queryKey: [`${campaignId}-rating-categories`] });
        },
    });

    const { mutateAsync: mutateUpdateCategory } = useMutation({
        mutationFn: ({ categoryId, name }: { categoryId: string, name: string }) => updateCategory(name, campaignId, categoryId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`${campaignId}-rating-categories`] });
        },
        onError: () => {
            queryClient.invalidateQueries({ queryKey: [`${campaignId}-rating-categories`] });
        },
    });

    const { mutateAsync: mutateDeleteCategory } = useMutation({
        mutationFn: (categoryId: string) => deleteCategory(campaignId, categoryId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`${campaignId}-rating-categories`] });
        },
        onError: () => {
            queryClient.invalidateQueries({ queryKey: [`${campaignId}-rating-categories`] });
        },
    });

    const { data: attachments } = useQuery({
        queryKey: [`${campaignId}-attachments`],
        queryFn: () => getCampaignAttachments(campaignId),
        retry: false, 
    });

    const { mutateAsync: mutateUploadAttachments } = useMutation({
        mutationFn: (files: File[]) => uploadAttachments(campaignId, files),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`${campaignId}-attachments`] });
        },
    });

    const { mutateAsync: mutateDeleteAttachment } = useMutation({
        mutationFn: (attachmentId: number) => deleteCampaignAttachment(attachmentId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`${campaignId}-attachments`] });
        },
        onError: () => {
            queryClient.invalidateQueries({ queryKey: [`${campaignId}-attachments`] });
        },
    })

    const [clientRoles, setClientRoles] = useState<ClientRole[]>([]);
    const [newRoleId, setNewRoleId] = useState<string>("0");
    const [hoveredDeleteIndex, setHoveredDeleteIndex] = useState<number | null>(null);
    const [descriptionHtmlState, setDescriptionHtmlState] = useState<string>("");
    const [dateError, setDateError] = useState<boolean>(false);
    const [roleNameError, setRoleNameError] = useState<{ [key: string]: boolean }>(
        clientRoles.reduce((acc, role) => ({ ...acc, [role.id]: false }), {})
    );
    const [rolePositionError, setRolePositionError] = useState<{ [key: string]: boolean }>(
        clientRoles.reduce((acc, role) => ({ ...acc, [role.id]: false }), {})
    );
    const [updatedCampaignDetails, setUpdatedCampaignDetails] = useState<CampaignDetailsData | null>(null);
    const [clientCategories, setClientCategories] = useState<ClientCategory[]>([]);
    const [newCategoryId, setNewCategoryId] = useState<string>("0");
    const [hoveredDeleteCategoryIndex, setHoveredDeleteCategoryIndex] = useState<number | null>(null);
    const [categoryNameError, setCategoryNameError] = useState<{ [key: string]: boolean }>(
        clientCategories.reduce((acc, category) => ({ ...acc, [category.id]: false }), {})
    );


    if (!editingMode && roles && !compareCampaignRoles(roles, clientRoles)) {
        setClientRoles(roles.map((role) => ({ ...role, deleting: false, new: false })));
    }

    if (!editingMode && ratingCategories && !compareRatingCategories(ratingCategories, clientCategories)) {
        setClientCategories(ratingCategories.map((category) => ({ ...category, deleting: false, new: false })));
    }

    const toggleEditingMode = () => {
        setEditingMode(true);
    };

    const handleUploadAttachments = async () => {
        try {
            // Open file picker
            const fileHandles = await (window as any).showOpenFilePicker({
                multiple: true,
                types: [
                    {
                        description: "PDF files",
                        accept: {
                            "application/pdf": [".pdf"],
                        },
                    },
                ],
            });
            
            const files = await Promise.all(fileHandles.map(async (fileHandle: any) => await fileHandle.getFile()));

            // Get pre-signed upload URLs from backend
            const uploadResults = await mutateUploadAttachments(files);
            
            // Upload each file to S3 using the pre-signed URLs
            // Match files to upload URLs by index (backend processes in order)
            await Promise.all(
                uploadResults.map((result, index) => {
                    if (index >= files.length) {
                        throw new Error("Mismatch between upload URLs and files");
                    }
                    return uploadFile(result.upload_url, files[index]);
                })
            );
            
            // Refresh attachments list
            queryClient.invalidateQueries({ queryKey: [`${campaignId}-attachments`] });
            
            toast.success(`${uploadResults.length} attachments uploaded successfully`);
        } catch (error) {
            // User cancelled file picker - handle gracefully, no error needed
            if ((error as any).name === 'AbortError' || (error as any).code === 20) {
                return;
            }
            toast.error("Failed to upload attachments");
            console.error("Upload error:", error);
        }
    }

    const handleDeleteAttachment = async (attachmentId: number) => {
        try {
            await mutateDeleteAttachment(attachmentId);
            toast.success("Attachment deleted successfully");
        } catch (error) {
            toast.error("Failed to delete attachment");
            console.error("Delete error:", error);
        }
    }

    const addNewRoleRow = () => {
        if (!editingMode) return;
        if (clientRoles.length >= parseInt(process.env.NEXT_PUBLIC_MAX_ROLE_LIMIT!)) {
            toast.warning(`You can only have up to ${parseInt(process.env.NEXT_PUBLIC_MAX_ROLE_LIMIT!)} roles per campaign`);
            return;
        }
        setClientRoles([...clientRoles, {
            // temp id for table row key
            id: newRoleId,
            campaign_id: campaignId,
            name: "New Role",
            description: "",
            min_available: 1,
            max_available: 1,
            finalised: false,
            deleting: false,
            new: true,
        }]);
        setNewRoleId(newRoleId + 1);
    };

    const addNewCategoryRow = () => {
        if (!editingMode) return;
        setClientCategories([...clientCategories, {
            id: newCategoryId,
            campaign_id: campaignId,
            name: "New Category",
            deleting: false,
            new: true,
        }]);
        setNewCategoryId(newCategoryId + 1);
    };

    const handleDeleteRole = (roleId: string) => {
        if (!editingMode) return;
        const deletingRole = clientRoles.find((r) => r.id === roleId);

        if (!deletingRole) return;

        setClientRoles(clientRoles.filter((r) => r !== deletingRole));

        deletingRole.deleting = true;

        setUpdatedCampaignDetails((prev) => {
            const prevRoles = prev?.clientRoles ?? [];
            const updatedRoles = prevRoles.filter((role) => role.id !== roleId);

            updatedRoles.push(deletingRole);
            return {
                ...prev,
                clientRoles: updatedRoles,
            };
        });
    };

    const handleDeleteCategory = (categoryId: string) => {
        if (!editingMode) return;
        const deletingCategory = clientCategories.find((c) => c.id === categoryId);

        if (!deletingCategory) return;

        setClientCategories(clientCategories.filter((c) => c !== deletingCategory));

        deletingCategory.deleting = true;

        setUpdatedCampaignDetails((prev) => {
            const prevCategories = prev?.clientCategories ?? [];
            const updatedCategories = prevCategories.filter((category) => category.id !== categoryId);

            updatedCategories.push(deletingCategory);
            return {
                ...prev,
                clientCategories: updatedCategories,
            };
        });
    };

    const updateCampaignDetails = (data: string | Date | undefined, key: CampaignUpdateKeys, index?: number) => {
        if (!data || !editingMode) return;

        if ((key === "roleName" || key === "roleMinAvailable" || key === "roleMaxAvailable") && index !== undefined) {
            const updatedRole = clientRoles?.[index] ?? null;
            if (!updatedRole) return;

            switch (key) {
                case "roleName":
                    updatedRole.name = String(data);
                    break;
                case "roleMinAvailable":
                    updatedRole.min_available = Number(data);
                    break;
                case "roleMaxAvailable":
                    updatedRole.max_available = Number(data);
                    break;
            }
            setUpdatedCampaignDetails((prev) => {
                const prevRoles = prev?.clientRoles ?? [];
                const updatedRoles = prevRoles.filter((role) => role.id !== updatedRole.id);
                updatedRoles.push(updatedRole);

                return {
                    ...prev,
                    clientRoles: updatedRoles,
                };
            });
            return;
        }

        if (key === "categoryName" && index !== undefined) {
            const updatedCategory = clientCategories?.[index] ?? null;
            if (!updatedCategory) return;

            updatedCategory.name = String(data);
            
            setUpdatedCampaignDetails((prev) => {
                const prevCategories = prev?.clientCategories ?? [];
                const updatedCategories = prevCategories.filter((category) => category.id !== updatedCategory.id);
                updatedCategories.push(updatedCategory);

                return {
                    ...prev,
                    clientCategories: updatedCategories,
                };
            });
            return;
        }

        setUpdatedCampaignDetails((prev) => {
            return {
                ...prev,
                [key]: data,
            };
        });
    };

    const saveUpdatedCampaignDetails = async () => {
        if (!updatedCampaignDetails) {
            setEditingMode(false);
            return;
        }

        let validationWarnings: string[] = [];
        if (updatedCampaignDetails.campaignName) {
            if (updatedCampaignDetails.campaignName.length > parseInt(process.env.NEXT_PUBLIC_EDIT_CAMPAIGN_HEADER_MAX_CHARS!)) {
                validationWarnings.push(`Campaign name must be less than ${parseInt(process.env.NEXT_PUBLIC_EDIT_CAMPAIGN_HEADER_MAX_CHARS!)} characters`);
            }
        }

        if (updatedCampaignDetails.description) {
            if (updatedCampaignDetails.description.length > parseInt(process.env.NEXT_PUBLIC_EDIT_CAMPAIGN_DESCRIPTION_MAX_CHARS!)) {
                validationWarnings.push(`Campaign description must be less than ${parseInt(process.env.NEXT_PUBLIC_EDIT_CAMPAIGN_DESCRIPTION_MAX_CHARS!)} characters`);
            }
        }

        if (updatedCampaignDetails.endsAt || updatedCampaignDetails.startsAt) {
            let startDate = updatedCampaignDetails.startsAt ?? new Date(campaign?.starts_at ?? "");
            let endDate = updatedCampaignDetails.endsAt ?? new Date(campaign?.ends_at ?? "");
            if (endDate.getFullYear() === startDate.getFullYear() && endDate.getMonth() === startDate.getMonth() && endDate.getDate() === startDate.getDate()) {
                validationWarnings.push("End date must be different from start date");
                setDateError(true);
            } else if (endDate < startDate) {
                validationWarnings.push("End date must be after start date");
                setDateError(true);
            }
        }

        if (updatedCampaignDetails.clientRoles) {
            let roleNameError = false;
            let minGreaterThanMaxError = false;
            let minLessThanZeroError = false;
            let maxLessThanZeroError = false;
            let rolePositionsGreaterThanMaxPosError = false;

            updatedCampaignDetails.clientRoles.forEach((role) => {
                if (role.name.length > parseInt(process.env.NEXT_PUBLIC_EDIT_CAMPAIGN_ROLE_NAME_MAX_CHARS!) && !roleNameError) {
                    validationWarnings.push(`Role name must be less than ${parseInt(process.env.NEXT_PUBLIC_EDIT_CAMPAIGN_ROLE_NAME_MAX_CHARS!)} characters`);
                    setRoleNameError(prev => ({ ...prev, [role.id]: true }));
                    roleNameError = true;
                }
                if (role.min_available > role.max_available && !minGreaterThanMaxError) {
                    validationWarnings.push("Minimum available positions must be less than maximum available positions");
                    setRolePositionError(prev => ({ ...prev, [role.id]: true }));
                    minGreaterThanMaxError = true;
                }
                if (role.min_available < 0 && !minLessThanZeroError) {
                    validationWarnings.push("Minimum available positions must be greater than 0");
                    setRolePositionError(prev => ({ ...prev, [role.id]: true }));
                    minLessThanZeroError = true;
                }
                if (role.max_available < 0 && !maxLessThanZeroError) {
                    validationWarnings.push("Maximum available positions must be greater than 0");  
                    setRolePositionError(prev => ({ ...prev, [role.id]: true }));
                    maxLessThanZeroError = true;
                }
                if ((role.min_available > parseInt(process.env.NEXT_PUBLIC_MAX_ROLE_LIMIT!) || 
                role.max_available > parseInt(process.env.NEXT_PUBLIC_MAX_ROLE_LIMIT!)) && !rolePositionsGreaterThanMaxPosError) {
                    validationWarnings.push(`Role positions must be less than or equal to ${parseInt(process.env.NEXT_PUBLIC_MAX_ROLE_LIMIT!)}`);
                    setRolePositionError(prev => ({ ...prev, [role.id]: true }));
                    rolePositionsGreaterThanMaxPosError = true;
                }
            });
        }

        if (validationWarnings.length > 0) {
            validationWarnings.forEach((warning) => {
                toast.warning(warning);
            });
            return;
        }

        const mutationResult = (async () => {
            // call mutations
            const campaignUpdate: CampaignUpdate = {
                slug: campaign?.campaign_slug ?? "",
                name: updatedCampaignDetails.campaignName ?? campaign?.name ?? "",
                description: updatedCampaignDetails.description ?? campaign?.description ?? "",
                starts_at: updatedCampaignDetails.startsAt?.toISOString() ?? campaign?.starts_at ?? "",
                ends_at: updatedCampaignDetails.endsAt?.toISOString() ?? campaign?.ends_at ?? "",
            };
            const campaignPromise = mutateCampaignDetails(campaignUpdate);

            const rolePromises = updatedCampaignDetails.clientRoles?.map((role) => {
                if (role.deleting === true) {
                    return mutateDeleteRole(role.id.toString());
                } else if (role.new === true) {
                    return mutateCreateCampaignRole({
                        id: role.id,
                        campaign_id: campaignId,
                        name: role.name,
                        description: role.description ?? undefined,
                        min_available: role.min_available,
                        max_available: role.max_available,
                        finalised: false
                    });
                } else {
                    return mutateUpdateRole({
                        roleId: role.id.toString(),
                        data: {
                            name: role.name,
                            description: role.description,
                            min_available: role.min_available,
                            max_available: role.max_available,
                            finalised: false,
                        },
                    });
                }
            }) ?? [];

            const categoryPromises = updatedCampaignDetails.clientCategories?.map((category) => {
                if (category.deleting === true) {
                    return mutateDeleteCategory(category.id.toString());
                } else if (category.new === true) {
                    return mutateCreateCategory(category.name);
                } else {
                    return mutateUpdateCategory({
                        categoryId: category.id.toString(),
                        name: category.name,
                    });
                }
            }) ?? [];

            await Promise.all([campaignPromise, ...rolePromises, ...categoryPromises]);
        })();

        toast.promise(mutationResult, {
                loading: "Saving campaign details...",
                success: "Campaign details saved successfully",
                error: "Failed to save some campaign details...",
            }
        );

        try {
            await mutationResult;
            setUpdatedCampaignDetails(null);
            setEditingMode(false);
            setNewRoleId("0");
            setNewCategoryId("0");
        } catch (err) {
            setClientRoles(roles?.map((role) => ({ ...role, deleting: false, new: false })) ?? []);
            setClientCategories(ratingCategories?.map((category) => ({ ...category, deleting: false, new: false })) ?? []);
        }
    };
    

    useEffect(() => {
        async function processMarkdown() {
            if (campaign?.description) {
                const processed = await remark()
                .use(html)
                .process(campaign.description);

                setDescriptionHtmlState(processed.toString());
            }
        }
        processMarkdown();
    }, [campaign?.description]);

    return (
        <div className="flex flex-col gap-3">
            <img className="w-full max-h-42 object-cover rounded-md" src={"/placeholder.svg"} alt={`${campaign?.name} cover image`} />
            <div className="flex items-center gap-2">
                <ButtonGroup>
                    <ButtonGroup>
                        <Link href={`/dashboard/organisation/${campaign?.organisation_id}/campaigns/${campaignId}/review`}>
                            <Button><BookOpenCheck className="w-4 h-4" /> {dict.dashboard.campaigns.review_applications}</Button>
                        </Link>
                    </ButtonGroup>
                    <ButtonGroup>
                        <Link href={`/dashboard/organisation/${campaign?.organisation_id}/campaigns/${campaignId}/applications`}>
                            <Button><BarChart className="w-4 h-4" /> {dict.dashboard.campaigns.application_summary}</Button>
                        </Link>
                    </ButtonGroup>
                    <ButtonGroup>
                        <CopyButton value={`${process.env.NEXT_PUBLIC_APP_URL}/campaign/${campaign?.organisation_slug}/${campaign?.campaign_slug}`}>
                            <Share className="w-4 h-4" /> {dict.dashboard.campaigns.share_link}
                        </CopyButton>
                        <CopyButton value={campaignId}>
                            <Copy className="w-4 h-4" /> {dict.dashboard.campaigns.copy_campaign_id}
                        </CopyButton>
                    </ButtonGroup>
                    {userRole?.role === "Admin" && (
                        <ButtonGroup>
                            {
                                editingMode ? (
                                    <Button variant="outline" onClick={saveUpdatedCampaignDetails} className="cursor-pointer"><Check className="w-4 h-4" /> {dict.dashboard.actions.save}</Button>
                                ) : (
                                    <Link href={`/dashboard/organisation/${orgId}/campaigns/${campaignId}/edit`}>
                                        <Button variant="outline" className="cursor-pointer"><Pencil className="w-4 h-4" /> {dict.dashboard.actions.edit}</Button>
                                    </Link>
                                )
                            }
                            <Button variant="outline" className="cursor-pointer"><Trash className="w-4 h-4" /> {dict.dashboard.actions.delete}</Button>
                        </ButtonGroup>
                    )}
                    {
                        !campaign?.published && (
                            <Link href={`/dashboard/organisation/${orgId}/campaigns/${campaignId}/questions`}>
                                <Button variant="outline"><FormIcon className="w-4 h-4" /> {dict.dashboard.campaigns.manage_questions}</Button>
                            </Link>
                        )
                    }
                    <ButtonGroup>
                        <Button variant="outline"><CircleCheck className="w-4 h-4 text-green-500" /> {dict.dashboard.campaigns.publish}</Button>
                    </ButtonGroup>

                </ButtonGroup>
            </div>
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-bold">
                    <EditDetail 
                        key={`${campaignId}-name`} 
                        namespace={`${campaignId}-name`} 
                        value={campaign?.name ?? ""} 
                        onChange={(value) => updateCampaignDetails(value, "campaignName")} 
                        editable={editingMode} 
                        maxLength={parseInt(process.env.NEXT_PUBLIC_EDIT_CAMPAIGN_HEADER_MAX_CHARS!)} 
                    />
                </h1>
                <CampaignDates 
                    starts_at={campaign?.starts_at ?? ""} 
                    ends_at={campaign?.ends_at ?? ""} 
                    editingMode={editingMode} 
                    onUpdate={updateCampaignDetails} 
                    isError={dateError}
                    setIsError={setDateError}
                />
            </div>

            <div className="max-w-[500px]">
                <h2 className="text-xl font-bold">{dict.common.roles}</h2>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">{dict.common.name}</TableHead>
                            <TableHead>{dict.dashboard.campaigns.roles.number_of_positions}</TableHead>
                            {editingMode && <TableHead className="w-[50px]"></TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {clientRoles?.map((role, index) => (
                            <TableRow
                                key={role.id}
                                className={cn(
                                    "group transition-colors",
                                    hoveredDeleteIndex === index && "bg-red-50! hover:bg-red-50!"
                                )}
                            >
                                <TableCell className="font-medium">
                                    <EditDetail 
                                        key={`${index}-name`} 
                                        namespace={`${index}-name`} 
                                        value={role.name} 
                                        onChange={(value) => updateCampaignDetails(value, "roleName", index)} 
                                        editable={editingMode} 
                                        maxLength={parseInt(process.env.NEXT_PUBLIC_EDIT_CAMPAIGN_ROLE_NAME_MAX_CHARS!)} 
                                        isError={roleNameError?.[role.id]}
                                        setIsError={() => setRoleNameError(prev => ({ ...prev, [role.id]: false }))}
                                    />
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <EditDetail 
                                            key={`${index}-min-available`} 
                                            namespace={`${index}-min-available`} 
                                            value={role.min_available.toString()} 
                                            onChange={(value) => updateCampaignDetails(value, "roleMinAvailable", index)} 
                                            editable={editingMode} 
                                            numOnly={true} 
                                            maxLength={parseInt(process.env.NEXT_PUBLIC_MAX_ROLE_LIMIT!)} 
                                            isError={rolePositionError?.[role.id]}
                                            setIsError={() => setRolePositionError(prev => ({ ...prev, [role.id]: false }))}
                                        />
                                        <span>-</span>
                                        <EditDetail 
                                            key={`${index}-max-available`} 
                                            namespace={`${index}-max-available`} 
                                            value={role.max_available.toString()} 
                                            onChange={(value) => updateCampaignDetails(value, "roleMaxAvailable", index)} 
                                            editable={editingMode} 
                                            numOnly={true} 
                                            maxLength={parseInt(process.env.NEXT_PUBLIC_MAX_ROLE_LIMIT!)} 
                                            isError={rolePositionError?.[role.id]}
                                            setIsError={() => setRolePositionError(prev => ({ ...prev, [role.id]: false }))}
                                        />
                                    </div>
                                </TableCell>
                                {editingMode && (
                                    <TableCell className="w-[50px]">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700 hover:bg-red-200"
                                            onMouseEnter={() => {
                                                setHoveredDeleteIndex(index);
                                            }}
                                            onMouseLeave={() => {
                                                setHoveredDeleteIndex(null);
                                            }}
                                            onClick={() => handleDeleteRole(role.id)}
                                        >
                                            <Trash className="w-4 h-4" />
                                        </Button>
                                    </TableCell>
                                )}
                            </TableRow>
                        ))}
                        {
                            editingMode && (
                                <TableRow>
                                    <TableCell colSpan={editingMode ? 3 : 2} className="text-right">
                                        <div className="flex justify-center w-full">
                                            <Button variant="outline" onClick={addNewRoleRow} className="w-full"><Plus className="w-4 h-4" /> {dict.dashboard.campaigns.roles.add_role}</Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )
                        }
                    </TableBody>
                </Table>
            </div>

            <div className="max-w-[500px]">
                <h2 className="text-xl font-bold">{dict.common.rating_categories}</h2>
                <Table>
                <TableHeader>
                <TableRow>
                <TableHead className="w-[100px]">{dict.common.name}</TableHead>
                    {editingMode && <TableHead className="w-[50px]"></TableHead>}
                </TableRow>
                    </TableHeader>
                    <TableBody>
                        {clientCategories?.map((category, index) => (
                            <TableRow key={category.id} className={cn("group transition-colors", hoveredDeleteCategoryIndex === index && "bg-red-50! hover:bg-red-50!")}>
                                <TableCell className="font-medium">
                                    <EditDetail 
                                        key={`${index}-category-name`} 
                                        namespace={`${index}-category-name`} 
                                        value={category.name} 
                                        onChange={(value) => updateCampaignDetails(value, "categoryName", index)} 
                                        editable={editingMode} 
                                        maxLength={100}
                                        isError={categoryNameError?.[category.id]}
                                        setIsError={() => setCategoryNameError(prev => ({ ...prev, [category.id]: false }))}
                                    />
                                </TableCell>
                                {editingMode && (
                                    <TableCell className="w-[50px]">
                                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700 hover:bg-red-200"
                                            onMouseEnter={() => {
                                                setHoveredDeleteCategoryIndex(index);
                                            }}
                                            onMouseLeave={() => {
                                                setHoveredDeleteCategoryIndex(null);
                                            }}
                                            onClick={() => handleDeleteCategory(category.id)}
                                        >
                                            <Trash className="w-4 h-4" />
                                        </Button>
                                    </TableCell>
                                )}
                            </TableRow>
                        ))}
                        {
                            editingMode && (
                                <TableRow>
                                    <TableCell colSpan={2} className="text-right">
                                        <div className="flex justify-center w-full">
                                            <Button variant="outline" onClick={addNewCategoryRow} className="w-full"><Plus className="w-4 h-4" /> {dict.dashboard.campaigns.add_category || "Add Category"}</Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )
                        }
                    </TableBody>
                </Table>
            </div>

            <div>
                <h2 className="text-xl font-bold">{dict.common.description}</h2>
                {editingMode ? (
                    <EditDetail
                        namespace={`${campaignId}-description`}
                        value={campaign?.description ?? ""}
                        onChange={(value) => updateCampaignDetails(value, "description")}
                        editable={editingMode}
                        maxLength={parseInt(process.env.NEXT_PUBLIC_EDIT_CAMPAIGN_DESCRIPTION_MAX_CHARS!)}
                        remainingHint={true}
                    />
                ) : (
                    <div dangerouslySetInnerHTML={{ __html: descriptionHtmlState }} />
                )}
            </div>
            {/* TODO: Add in the column roles */}
            <div>
                <h2 className="text-xl font-bold">{dict.common.attachments}</h2>
                {editingMode && (
                    <Button variant="outline" onClick={handleUploadAttachments} className="cursor-pointer mt-3 p-6 w-[25%]">
                        <Upload className="w-4 h-4" /> {dict.dashboard.campaigns.roles.upload_attachments}
                    </Button>
                )}
                {attachments && attachments.length > 0 && (
                    <div className="mt-3">
                        {attachments.map(attachment => (
                            <div className="flex items-center gap-2" key={attachment.id}>
                                <a 
                                    href={attachment.download_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 hover:text-blue-800 underline flex items-center gap-2"
                                >
                                <FileText className="w-4 h-4" />
                                    {attachment.file_name}
                                </a>
                                {editingMode && (
                                    <X className="w-4 h-4 cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-200" onClick={() => handleDeleteAttachment(attachment.id)} />
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}