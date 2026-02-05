import { getDictionary } from "@/app/[lang]/dictionaries";
import { getCampaignBySlugs } from "@/models/campaign";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import CampaignInfo from "./campaign-info";
import { redirect } from "next/navigation";


export default async function CampaignPage({ params }: { params: Promise<{ orgSlug: string, campaignSlug: string, lang: string }> }) {
    const { orgSlug, campaignSlug, lang } = await params;
    const dict = await getDictionary(lang);
    const queryClient = new QueryClient();

    let campaign;
    try {
        campaign = await getCampaignBySlugs(orgSlug, campaignSlug);
    } catch (error) {
        console.error("Failed to load campaign:", error);
        // redirect to an error page
        redirect(`/${lang}/campaign/${orgSlug}/${campaignSlug}/unpublished`);
    }

    if (!campaign.published) {
        redirect(`/${lang}/campaign/${orgSlug}/${campaignSlug}/unpublished`);
    }

    await queryClient.prefetchQuery({
        queryKey: [`${orgSlug}-${campaignSlug}-campaign-details`],
        queryFn: () => Promise.resolve(campaign),
    });

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <CampaignInfo orgSlug={orgSlug} campaignSlug={campaignSlug} dict={dict} lang={lang}/>
        </HydrationBoundary>
    )
}