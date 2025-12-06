"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ImageUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { CampaignDetails } from "@/models/campaign";
import ImageUpload from "@/components/ui/image-upload";
import { DatePicker } from "@/components/ui/date-picker";

export default function NewCampaignForm({campaign, orgId, dict, submitData} : { campaign?: CampaignDetails, orgId: string, dict: any, submitData: (name: string, description: string, starts_at: string, ends_at: string) => Promise<void> }) {
    const [name, setName] = useState(campaign?.name ?? "");
    const [description, setDescription] = useState(campaign?.campaign_slug ?? "");
    const [startDate, setStartDate] = useState(campaign?.starts_at ?? "");
    const [endDate, setEndDate] = useState(campaign?.ends_at ?? "");

    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        await submitData(name, description, startDate, endDate);
        setSaving(false);
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
                <ImageUpload />
                <div className="flex flex-col gap-1">
                    <Label>{dict.common.name}</Label>
                    <Input className="max-w-[300px]" type="text" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1">
                    <Label>{dict.common.description}</Label>
                    <Textarea className="max-w-2xl min-h-[300px]" value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
                <DatePicker label={dict.common.starts_at} value={startDate} onChange={(value) => setStartDate(value)} />
                <DatePicker label={dict.common.ends_at} value={endDate} onChange={(value) => setEndDate(value)} />
                <div>
                    <Button disabled={!name || !ImageUpload || !startDate || !endDate || saving} onClick={async () => await handleSave()}>{dict.dashboard.actions.save}</Button>
                </div>
            </div>
        </div>
    );

}