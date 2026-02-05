import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { getCampaign, getCampaignBySlugs } from "@/models/campaign";
import { getDictionary } from "@/app/[lang]/dictionaries"
import Unpublished from "./unpublished";

async function UnpublishedPage({
  params,
}: {
  params: Promise<{ orgSlug: string; campaignSlug: string; lang: string }>;
}) {
    const { orgSlug, campaignSlug, lang } = await params;
    const queryClient = new QueryClient();
    const dict = await getDictionary(lang);

    const campaign = await getCampaignBySlugs(orgSlug, campaignSlug);
    const campaignId = campaign.id.toString();

    await queryClient.prefetchQuery({
        queryKey: [`${campaignId}-campaign-info`],
        queryFn: () => getCampaign(campaignId),
    });

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <Unpublished
                campaignId={campaignId}
                dict={dict}
            />
        </HydrationBoundary>
    );
}

export default UnpublishedPage