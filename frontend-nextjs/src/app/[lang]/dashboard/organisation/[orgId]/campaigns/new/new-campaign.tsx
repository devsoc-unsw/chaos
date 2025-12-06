"use client";

import {createCampaign, setCampaignCoverImage} from "@/models/campaign";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { redirect } from "next/navigation";
import NewCampaignForm from "../campaign-form";

export default function CampaignNewForm({ orgId, dict }: { orgId: string, dict: any }) {
    const queryClient = useQueryClient();

        const submitData = async (name: string, description: string, starts_at: string, ends_at: string) => {
            const res = await createCampaign({name, description, slug: name, starts_at, ends_at, organisation_id: orgId}, orgId);
            const campaignId = typeof res.id === "number" ? BigInt(res.id).toString() : res.id;
            await setCampaignCoverImage(campaignId);
            await queryClient.invalidateQueries({ queryKey: [`${orgId}-campaigns`] });
            redirect(`/dashboard/organisation/${orgId}/campaigns`);
        }

    return (
        <NewCampaignForm orgId={orgId} dict={dict} submitData={submitData} />
    )

}