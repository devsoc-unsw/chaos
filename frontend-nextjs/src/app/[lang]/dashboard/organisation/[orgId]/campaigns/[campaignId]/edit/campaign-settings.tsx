"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CampaignUpdate, createCampaignRole, getCampaign, getCampaignRoles, updateCampaign, RoleDetails, setCampaignCoverImage } from "@/models/campaign";
import { uploadFile } from "@/models/file";
import { getRatingCategories, createCategory, updateCategory, deleteCategory, RatingCategory } from "@/models/rating";
import { Button } from "@/components/ui/button";
import { Copy, Pencil, Trash, Share, BookOpenCheck, Check, Plus, FormIcon, CircleCheck, Upload, X, FileText, BarChart, ArrowLeft } from "lucide-react";
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
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import SlugInput from "@/components/slug-input";
import { DatePicker } from "@/components/ui/date-picker";
import ImageUpload from "@/components/ui/image-upload";
import { snowflakeGenerator } from "@/lib";
import { deleteRole, RoleUpdate, updateRole } from "@/models/role";
import { toast } from "sonner";
import Image from "next/image";

export default function CampaignSettings({ campaignId, orgId, dict }: { campaignId: string, orgId: string, dict: any }) {
    const queryClient = useQueryClient();

    const { data: campaign } = useQuery({
        queryKey: [`${campaignId}-campaign-details`],
        queryFn: () => getCampaign(campaignId),
    });

    const { data: roles } = useQuery({
        queryKey: [`${campaignId}-campaign-roles`],
        queryFn: () => getCampaignRoles(campaignId),
    });

    const { data: ratingCategories } = useQuery({
        queryKey: [`${campaignId}-rating-categories`],
        queryFn: () => getRatingCategories(campaignId),
    });
    const [campaignName, setCampaignName] = useState(campaign?.name ?? "");
    const [campaignSlug, setCampaignSlug] = useState(campaign?.campaign_slug ?? "");
    const [campaignDescription, setCampaignDescription] = useState(campaign?.description ?? "");
    const [campaignStartsAt, setCampaignStartsAt] = useState(new Date(campaign?.starts_at ?? "").toISOString());
    const [campaignEndsAt, setCampaignEndsAt] = useState(new Date(campaign?.ends_at ?? "").toISOString());
    const [selectedBanner, setSelectedBanner] = useState<File | null>(null);
    const [bannerUploading, setBannerUploading] = useState(false);

    const { mutateAsync: mutateUpdateCampaignDetails } = useMutation({
        mutationFn: (data: CampaignUpdate) => updateCampaign(campaignId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`${campaignId}-campaign-details`] });
        },
        onError: () => {
            queryClient.invalidateQueries({ queryKey: [`${campaignId}-campaign-details`] });
        },
    })

    const { mutateAsync: mutateAddRole } = useMutation({
        mutationFn: (data: RoleDetails) => createCampaignRole(campaignId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`${campaignId}-campaign-roles`] });
        },
        onError: () => {
            queryClient.invalidateQueries({ queryKey: [`${campaignId}-campaign-roles`] });
        },
    })

    const { mutateAsync: mutateUpdateRole } = useMutation({
        mutationFn: ({ roleId, data }: { roleId: string, data: RoleUpdate }) => updateRole(roleId, data),
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

    const { mutateAsync: mutateAddRatingCategory } = useMutation({
        mutationFn: (name: string) => createCategory(name, campaignId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`${campaignId}-rating-categories`] });
        },
        onError: () => {
            queryClient.invalidateQueries({ queryKey: [`${campaignId}-rating-categories`] });
        },
    })

    const { mutateAsync: mutateUpdateRatingCategory } = useMutation({
        mutationFn: ({ name, categoryId }: { name: string, categoryId: string }) => updateCategory(name, campaignId, categoryId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`${campaignId}-rating-categories`] });
        },
        onError: () => {
            queryClient.invalidateQueries({ queryKey: [`${campaignId}-rating-categories`] });
        },
    });

    const { mutateAsync: mutateDeleteRatingCategory } = useMutation({
        mutationFn: (categoryId: string) => deleteCategory(campaignId, categoryId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`${campaignId}-rating-categories`] });
        },
        onError: () => {
            queryClient.invalidateQueries({ queryKey: [`${campaignId}-rating-categories`] });
        },
    });

    const handleCampaignDetailsUpdate = (overrides?: Partial<CampaignUpdate>) => {
        mutateUpdateCampaignDetails({
            name: campaignName,
            slug: campaignSlug,
            description: campaignDescription,
            starts_at: campaignStartsAt,
            ends_at: campaignEndsAt,
            ...overrides,
        });
    };

    const existingBannerSrc =
        campaign?.cover_image_url ||
        (campaign?.cover_image && /^https?:\/\//i.test(campaign.cover_image)
            ? campaign.cover_image
            : null) ||
        "/placeholder.svg";

    const handleBannerUpload = async () => {
        if (!selectedBanner) {
            return;
        }
        setBannerUploading(true);
        try {
            const { upload_url } = await setCampaignCoverImage(campaignId);
            await uploadFile(upload_url, selectedBanner);
            setSelectedBanner(null);
            await queryClient.invalidateQueries({ queryKey: [`${campaignId}-campaign-details`] });
            toast.success(dict.dashboard.campaigns.settings.campaign_banner_uploaded);
        } catch (e) {
            const detail = e instanceof Error ? e.message : "";
            toast.error(
                detail
                    ? `${dict.dashboard.campaigns.settings.campaign_banner_failed} ${detail}`
                    : dict.dashboard.campaigns.settings.campaign_banner_failed
            );
        } finally {
            setBannerUploading(false);
        }
    };

    return (
        <div className="flex flex-col gap-10 max-w-2xl">
            <div>
                <Link href={`/dashboard/organisation/${orgId}/campaigns/${campaignId}`}>
                    <div className="flex items-center gap-1">
                        <ArrowLeft className="w-4 h-4" />
                        {dict.common.back}
                    </div>
                </Link>
                <h1 className="text-2xl font-bold">{dict.dashboard.campaigns.settings.campaign_settings}</h1>
                <p className="text-lg font-medium">{campaign?.name}</p>
            </div>

            {/* General Settings */}
            <div className="flex flex-col gap-5">
                <h2 className="text-lg font-semibold">{dict.dashboard.campaigns.settings.general_settings}</h2>
                <div className="flex flex-col gap-1">
                    <Label htmlFor="campaign-name">{dict.common.name}</Label>
                    <Input value={campaignName} onChange={(e) => setCampaignName(e.target.value)} onBlur={() => handleCampaignDetailsUpdate()} />
                </div>

                <div className="flex flex-col gap-1">
                    <Label htmlFor="campaign-slug">{dict.common.slug}</Label>
                    <SlugInput orgId={orgId} name={campaignName} value={campaignSlug} currentSlug={campaign?.campaign_slug} onChange={(value) => setCampaignSlug(value)} onBlur={handleCampaignDetailsUpdate} dict={dict} />
                </div>

                <div className="flex flex-col gap-1">
                    <Label htmlFor="campaign-description">{dict.common.description}</Label>
                    <Textarea className="min-h-[300px]" value={campaignDescription} onChange={(e) => setCampaignDescription(e.target.value)} onBlur={() => handleCampaignDetailsUpdate()} />
                </div>

                <div className="flex flex-col gap-1">
                    <DatePicker label={dict.common.starts_at} value={campaignStartsAt} onChange={(value) => { setCampaignStartsAt(value); handleCampaignDetailsUpdate({ starts_at: value }) }} />
                </div>

                <div className="flex flex-col gap-1">
                    <DatePicker label={dict.common.ends_at} value={campaignEndsAt} onChange={(value) => { setCampaignEndsAt(value); handleCampaignDetailsUpdate({ ends_at: value }) }} />
                </div>

                <div className="flex flex-col gap-3">
                    <h3 className="text-base font-semibold">
                        {dict.dashboard.campaigns.settings.campaign_banner}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        {dict.dashboard.campaigns.settings.campaign_banner_help}
                    </p>
                    <div className="relative h-40 w-full overflow-hidden rounded-lg border bg-muted">
                        <Image
                            src={existingBannerSrc}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 672px"
                            unoptimized={existingBannerSrc.startsWith("http")}
                        />
                    </div>
                    <ImageUpload
                        selectedImage={selectedBanner}
                        onImageChange={setSelectedBanner}
                    />
                    <Button
                        type="button"
                        disabled={!selectedBanner || bannerUploading}
                        onClick={() => void handleBannerUpload()}
                    >
                        <Upload className="mr-2 h-4 w-4" />
                        {dict.dashboard.campaigns.settings.upload_banner}
                    </Button>
                </div>
            </div>

            {/* Role Settings */}
            <div className="flex flex-col gap-5">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">{dict.dashboard.campaigns.settings.role_settings}</h2>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            const newRoleId = snowflakeGenerator.generate().toString();
                            const newRole: RoleDetails = {
                                id: newRoleId,
                                campaign_id: campaignId,
                                name: `New Role ${newRoleId}`,
                                description: "",
                                min_available: 1,
                                max_available: 2,
                                finalised: false,
                            };
                            mutateAddRole(newRole);
                        }}
                    >
                        <Plus className="w-4 h-4 mr-1" />
                        {dict.common.add}
                    </Button>
                </div>
                {roles?.map((r) =>
                    <RoleCard key={r.id} role={r} updateRole={mutateUpdateRole} deleteRole={mutateDeleteRole} dict={dict} />
                )}
            </div>

            {/* Rating Settings */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">{dict.dashboard.campaigns.settings.rating_category_settings}</h2>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            const newCategoryId = snowflakeGenerator.generate().toString();
                            mutateAddRatingCategory(`New Category ${newCategoryId}`);
                        }}
                    >
                        <Plus className="w-4 h-4 mr-1" />
                        {dict.common.add}
                    </Button>
                </div>
                {ratingCategories?.map((r) =>
                    <RatingCategoryCard key={r.id} category={r} updateCategory={mutateUpdateRatingCategory} deleteCategory={mutateDeleteRatingCategory} />
                )}
            </div>

            {/* Attachment Settings */}
            <div className="flex flex-col gap-2">
                <h2 className="text-lg font-semibold">{dict.common.attachments}</h2>
                <p>**In development**</p>
            </div>
        </div>
    );
}

function RoleCard({ role, updateRole, deleteRole, dict }: { role: RoleDetails, updateRole: ({ roleId, data }: { roleId: string, data: RoleUpdate }) => void, deleteRole: (roleId: string) => void, dict: any }) {
    const [name, setName] = useState(role.name);
    const [minAvailable, setMinAvailable] = useState(role.min_available);
    const [maxAvailable, setMaxAvailable] = useState(role.max_available);
    const [description, setDescription] = useState(role.description ?? "");

    const handleUpdate = () => {
        updateRole({
            roleId: role.id,
            data: {
                name: name,
                min_available: minAvailable,
                max_available: maxAvailable,
                description: description,
                finalised: true,
            },
        });
    }

    return (
        <div className="border p-2 rounded-md">
            <div className="flex gap-1 items-center">
                <div className="flex-1">
                    <Label className="text-xs text-muted-foreground">{dict.common.name}</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} onBlur={handleUpdate} />
                </div>
                <div className="w-24">
                    <Label className="text-xs text-muted-foreground">{dict.common.min}</Label>
                    <Input type="number" value={minAvailable} onChange={(e) => setMinAvailable(parseInt(e.target.value) || 0)} onBlur={handleUpdate} />
                </div>
                <div className="w-24">
                    <Label className="text-xs text-muted-foreground">{dict.common.max}</Label>
                    <Input type="number" value={maxAvailable} onChange={(e) => setMaxAvailable(parseInt(e.target.value) || 0)} onBlur={handleUpdate} />
                </div>
                <Button variant="ghost" size="icon" className="mt-4" onClick={() => deleteRole(role.id)}>
                    <Trash className="w-4 h-4 text-destructive" />
                </Button>
            </div>
            <div className="mt-2">
                <Label className="text-xs text-muted-foreground">{dict.common.description}</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} onBlur={handleUpdate} />
            </div>
        </div>
    )
}

function RatingCategoryCard({ category, updateCategory, deleteCategory }: { category: RatingCategory, updateCategory: ({ name, categoryId }: { name: string, categoryId: string }) => void, deleteCategory: (categoryId: string) => void }) {
    const [name, setName] = useState(category.name);

    const handleUpdate = () => {
        updateCategory({
            name: name,
            categoryId: category.id,
        });
    }

    return (
        <div>
            <div className="flex gap-1 items-center">
                <div className="flex-1">
                    <Input value={name} onChange={(e) => setName(e.target.value)} onBlur={handleUpdate} />
                </div>
                <Button variant="ghost" size="icon" onClick={() => deleteCategory(category.id)}>
                    <Trash className="w-4 h-4 text-destructive" />
                </Button>
            </div>
        </div>
    )
}