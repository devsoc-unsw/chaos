import { getDictionary } from "@/app/[lang]/dictionaries";
import { getCampaignBySlugs } from "@/models/campaign";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import CampaignInfo from "./campaign-info";


export default async function CampaignPage({ params }: { params: Promise<{ orgSlug: string, campaignSlug: string, lang: string }> }) {
    const { orgSlug, campaignSlug, lang } = await params;
    const dict = await getDictionary(lang);
    const queryClient = new QueryClient();

    await queryClient.prefetchQuery({
        queryKey: [`${orgSlug}-${campaignSlug}-campaign-details`],
        queryFn: () => getCampaignBySlugs(orgSlug, campaignSlug),
    });

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <CampaignInfo orgSlug={orgSlug} campaignSlug={campaignSlug} dict={dict} lang={lang}/>
        </HydrationBoundary>
    )

}