import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { getDictionary } from "@/app/[lang]/dictionaries";
import { getCampaign, getCampaignRoles } from "@/models/campaign";
import { getOffersByCampaign } from "@/models/offer";
import OffersOverview from "./view-offers";

export default async function OffersOverviewPage({
  params,
}: {
  params: Promise<{ campaignId: string; orgId: string; lang: string }>;
}) {
    const { campaignId, orgId, lang } = await params;
    const dict = await getDictionary(lang);
    const queryClient = new QueryClient();

    await queryClient.prefetchQuery({
        queryKey: [`${campaignId}-campaign-details`],
        queryFn: () => getCampaign(campaignId),
    });

    await queryClient.prefetchQuery({
        queryKey: [`${campaignId}-campaign-offers`],
        queryFn: () => getOffersByCampaign(campaignId),
    });

    await queryClient.prefetchQuery({
        queryKey: [`${campaignId}-campaign-roles`],
        queryFn: () => getCampaignRoles(campaignId),
    });
    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <OffersOverview campaignId={campaignId} orgId={orgId} dict={dict} />
        </HydrationBoundary>
    )
}