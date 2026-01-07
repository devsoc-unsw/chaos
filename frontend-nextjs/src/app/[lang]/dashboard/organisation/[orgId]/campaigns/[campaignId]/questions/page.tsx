import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { getDictionary } from "@/app/[lang]/dictionaries";
import { getApplicationRatingsSummary } from "@/models/application";
import { getCampaign, getCampaignRoles } from "@/models/campaign";
import CampaignQuestions from "./campaign-questions";

export default async function ApplicationAvgRatingsPage({ params }: { params: Promise<{ campaignId: string, orgId: string, lang: string }>; }) {
    const { lang, campaignId, orgId } = await params;
    const dict = await getDictionary(lang);
    const queryClient = new QueryClient();

    await queryClient.prefetchQuery({
      queryKey: [`${campaignId}-campaign-details`],
      queryFn: () => getCampaign(campaignId),
    });

    await queryClient.prefetchQuery({
      queryKey: [`${campaignId}-campaign-roles`],
      queryFn: () => getCampaignRoles(campaignId),
    });

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <CampaignQuestions campaignId={campaignId} orgId={orgId} dict={dict} />
        </HydrationBoundary>
    );
}