import {
    dehydrate,
    HydrationBoundary,
    QueryClient,
} from '@tanstack/react-query';
import { getCampaign, getCampaignApplications, getCampaignRoles } from '@/models/campaign';
import { getRatingCategories } from '@/models/rating';
import { getDictionary } from '@/app/[lang]/dictionaries';
import ReviewCampaignApplications from './review-applications';

export default async function CampaignReviewPage({ params }: { params: Promise<{ campaignId: string, orgId: string, lang: string }> }) {
    const { campaignId, orgId, lang } = await params;
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

    await queryClient.prefetchQuery({
        queryKey: [`${campaignId}-campaign-applications`],
        queryFn: () => getCampaignApplications(campaignId),
    });

    await queryClient.prefetchQuery({
        queryKey: [`${campaignId}-rating-categories`],
        queryFn: () => getRatingCategories(campaignId),
    });

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <ReviewCampaignApplications campaignId={campaignId} orgId={orgId} dict={dict} />
        </HydrationBoundary>
    );
}
