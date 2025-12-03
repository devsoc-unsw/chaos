"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CampaignUpdate, createCampaignRole, getCampaign, getCampaignRoles, updateCampaign } from "@/models/campaign";
import { Button } from "@/components/ui/button";
import { Copy, Pencil, Trash, Share, BookOpenCheck, Check, Plus } from "lucide-react";
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
import { CampaignRole } from "@/models/campaign";
import CampaignDates from "./campaign-dates";
import { RoleUpdate, deleteRole, updateRole } from "@/models/role";
import { toast } from "sonner";
import { remark } from "remark";
import html from "remark-html";

interface ClientRole extends CampaignRole {
    deleting: boolean;
    new: boolean;
}

interface CampaignDetailsData {
    campaignName?: string;
    clientRoles?: ClientRole[];
    description?: string;
    startsAt?: Date;
    endsAt?: Date;
}

export type CampaignUpdateKeys = keyof CampaignDetailsData | "roleName" | "roleMinAvailable" | "roleMaxAvailable";

function compareCampaignRoles(roles: CampaignRole[], clientRoles: ClientRole[]): boolean {
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
        mutationFn: (data: CampaignRole) => createCampaignRole(campaignId, data),
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

    const [clientRoles, setClientRoles] = useState<ClientRole[]>([]);
    const [newRoleId, setNewRoleId] = useState<number>(0);
    const [hoveredDeleteIndex, setHoveredDeleteIndex] = useState<number | null>(null);
    const [descriptionHtmlState, setDescriptionHtmlState] = useState<string>("");
    const [dateError, setDateError] = useState<boolean>(false);
    const [roleNameError, setRoleNameError] = useState<{ [key: number]: boolean }>(
        clientRoles.reduce((acc, role) => ({ ...acc, [role.id]: false }), {})
    );
    const [rolePositionError, setRolePositionError] = useState<{ [key: number]: boolean }>(
        clientRoles.reduce((acc, role) => ({ ...acc, [role.id]: false }), {})
    );
    const [updatedCampaignDetails, setUpdatedCampaignDetails] = useState<CampaignDetailsData | null>(null);

    if (!editingMode && roles && !compareCampaignRoles(roles, clientRoles)) {
        setClientRoles(roles.map((role) => ({ ...role, deleting: false, new: false })));
    }

    const toggleEditingMode = () => {
        setEditingMode(true);
    };

    const addNewRoleRow = () => {
        if (!editingMode) return;
        if (clientRoles.length >= parseInt(process.env.NEXT_PUBLIC_MAX_ROLE_LIMIT!)) {
            toast.warning(`You can only have up to ${parseInt(process.env.NEXT_PUBLIC_MAX_ROLE_LIMIT!)} roles per campaign`);
            return;
        }
        setClientRoles([...clientRoles, {
            // temp id for table row key
            id: newRoleId,
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

    const handleDeleteRole = (roleId: number) => {
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
            await Promise.all([campaignPromise, ...rolePromises]);
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
            setNewRoleId(0);
        } catch (err) {
            setClientRoles(roles?.map((role) => ({ ...role, deleting: false, new: false })) ?? []);
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
                        <Button variant="outline" onClick={() => navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_NEXT_PUBLIC_APP_URL}/campaign/${campaign?.organisation_slug}/${campaign?.campaign_slug}`)}>
                            <Share className="w-4 h-4" /> {dict.dashboard.campaigns.share_link}
                        </Button>
                    </ButtonGroup>
                    {userRole?.role === "Admin" && (
                        <ButtonGroup>
                            {
                                editingMode ? (
                                    <Button variant="outline" onClick={saveUpdatedCampaignDetails}><Check className="w-4 h-4" /> {dict.dashboard.actions.save}</Button>
                                ) : (
                                    <Button variant="outline" onClick={toggleEditingMode}><Pencil className="w-4 h-4" /> {dict.dashboard.actions.edit}</Button>
                                )
                            }
                            <Button variant="outline"><Trash className="w-4 h-4" /> {dict.dashboard.actions.delete}</Button>
                        </ButtonGroup>
                    )}
                    <ButtonGroup>
                        <Button variant="outline" onClick={() => navigator.clipboard.writeText(campaignId)}>
                            <Copy className="w-4 h-4" /> {dict.dashboard.campaigns.copy_campaign_id}
                        </Button>
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
        </div>
    );
}