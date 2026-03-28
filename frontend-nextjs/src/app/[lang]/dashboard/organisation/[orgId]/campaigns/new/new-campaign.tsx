"use client";

import { checkCampaignSlugAvailability, createCampaign, setCampaignCoverImage } from "@/models/campaign";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { ArrowLeft, InfoIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import ImageUpload from "@/components/ui/image-upload";
import { DatePicker } from "@/components/ui/date-picker";
import { createProperSlug } from "@/models/slug";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { getOrganisationById } from "@/models/organisation";
import { uploadFile } from "@/models/file";
import { createCategory } from "@/models/rating";
import SlugInput from "@/components/slug-input";

export default function CampaignNewForm({ orgId, dict }: { orgId: string, dict: any }) {
    const queryClient = useQueryClient();


    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [suggestedSlug, setSuggestedSlug] = useState("");
    const [slug, setSlug] = useState("");
    const [slugAvailable, setSlugAvailable] = useState(true);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [selectedImage, setSelectedImage] = useState<File | null>(null);

    const [saving, setSaving] = useState(false);

    const submitData = async () => {
        if (!slugAvailable || !selectedImage) {
            return;
        }

        setSaving(true);
        const res = await createCampaign(name, description, startDate, endDate, orgId, slug);
        const campaignId = res.id;
        const bannerUpdate = await setCampaignCoverImage(campaignId);
        
        uploadFile(bannerUpdate.upload_url, selectedImage);

        await queryClient.invalidateQueries({ queryKey: [`${orgId}-campaigns`] });
        await createCategory('general', campaignId);
        setSaving(false);
        redirect(`/dashboard/organisation/${orgId}/campaigns/${campaignId}`);
    }

    const handleNameChange = (name: string) => {
        setName(name);
        setSuggestedSlug(createProperSlug(name));
    }

    return (
        <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center">
                <div>
                    <Link href={`/dashboard/organisation/${orgId}/campaigns`}>
                        <div className="flex items-center gap-1">
                            <ArrowLeft className="w-4 h-4" />
                            {dict.common.back}
                        </div>
                    </Link>
                    <h1 className="text-2xl font-bold">{dict.dashboard.campaigns.edit_campaign}</h1>
                </div>
            </div>
            <div className="flex flex-col gap-3">
                <ImageUpload selectedImage={selectedImage} onImageChange={setSelectedImage} />
                <div className="flex flex-col gap-1">
                    <Label>{dict.common.name}</Label>
                    <Input className="max-w-[300px]" type="text" value={name} onChange={(e) => handleNameChange(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1">
                    <div className="flex gap-1">
                        <Label>{dict.common.slug}</Label>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <InfoIcon className="w-4 h-4" />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{dict.dashboard.slug_tooltip}</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                    <SlugInput orgId={orgId} name={name} value={slug} currentSlug={suggestedSlug} onChange={(value) => setSlug(value)} onBlur={() => {}} updateSlugAvailable={setSlugAvailable} dict={dict} />
                </div>
                <div className="flex flex-col gap-1">
                    <Label>{dict.common.description}</Label>
                    <Textarea className="max-w-2xl min-h-[300px]" value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
                <DatePicker label={dict.common.starts_at} value={startDate} onChange={(value) => setStartDate(value)} />
                <DatePicker label={dict.common.ends_at} value={endDate} onChange={(value) => setEndDate(value)} />
                <div>
                    <Button disabled={!name || !selectedImage || !startDate || !endDate || saving || !slugAvailable || !slug} onClick={async () => await submitData()}>{dict.dashboard.actions.save}</Button>
                </div>
            </div>
        </div>
    )

}