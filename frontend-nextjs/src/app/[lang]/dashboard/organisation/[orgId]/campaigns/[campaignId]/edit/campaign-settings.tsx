"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CampaignUpdate, createCampaignRole, getCampaign, getCampaignRoles, updateCampaign, getCampaignAttachments, uploadAttachments, deleteCampaignAttachment, CampaignRole, RoleDetails } from "@/models/campaign";
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
import { getOrganisationUserRole } from "@/models/organisation";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import SlugInput from "@/components/slug-input";
import { DatePicker } from "@/components/ui/date-picker";

export default function CampaignDetails({ campaignId, orgId, dict }: { campaignId: string, orgId: string, dict: any }) {
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

    const [campaignRoles, setCampaignRoles] = useState<RoleDetails[]>(roles ?? []);
    const [campaignRatingCategories, setCampaignRatingCategories] = useState<RatingCategory[]>(ratingCategories ?? []);

    return (
        <div className="flex flex-col gap-3 max-w-xl">
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
            <div className="flex flex-col gap-2">
                <h2 className="text-lg font-semibold">{dict.dashboard.campaigns.settings.general_settings}</h2>
                <div className="flex flex-col gap-1">
                    <Label htmlFor="campaign-name">{dict.common.name}</Label>
                    <Input value={campaignName} onChange={(e) => setCampaignName(e.target.value)} />
                </div>

                <div className="flex flex-col gap-1">
                    <Label htmlFor="campaign-slug">{dict.common.slug}</Label>
                    <SlugInput orgId={orgId} name={campaignName} value={campaignSlug} currentSlug={campaign?.campaign_slug} onChange={(value) => setCampaignSlug(value)} dict={dict} />
                </div>

                <div className="flex flex-col gap-1">
                    <Label htmlFor="campaign-description">{dict.common.description}</Label>
                    <Textarea value={campaignDescription} onChange={(e) => setCampaignDescription(e.target.value)} />
                </div>

                <div className="flex flex-col gap-1">
                    <DatePicker label={dict.common.starts_at} value={campaignStartsAt} onChange={(value) => { setCampaignStartsAt(value) }} />
                </div>

                <div className="flex flex-col gap-1">
                    <DatePicker label={dict.common.ends_at} value={campaignEndsAt} onChange={(value) => setCampaignEndsAt(value)} />
                </div>
            </div>

            {/* Role Settings */}
            <div className="flex flex-col gap-2">
                <h2 className="text-lg font-semibold">{dict.dashboard.campaigns.settings.role_settings}</h2>
                {campaignRoles.map((r) =>
                    <div key={r.id} className="border p-2 rounded-md">
                        <div className="flex gap-1">
                            <Input value={r.name} onChange={(e) => { }} />
                            <Input value={r.min_available} onChange={(e) => { }} />
                            <Input value={r.max_available} onChange={(e) => { }} />
                        </div>
                        <Input value={r.description} onChange={(e) => { }} />
                    </div>
                )}
            </div>

            {/* Rating Settings */}
            <div className="flex flex-col gap-2">
                <h2 className="text-lg font-semibold">{dict.dashboard.campaigns.settings.rating_category_settings}</h2>
                {campaignRatingCategories.map((r) =>
                    <div key={r.id} className="border p-2 rounded-md">
                        <div className="flex gap-1">
                            <Input value={r.name} onChange={(e) => { }} />
                        </div>
                    </div>
                )}
            </div>

            {/* Attachment Settings */}
            <div className="flex flex-col gap-2">
                <h2 className="text-lg font-semibold">{dict.common.attachments}</h2>
            </div>


        </div>
    );
}