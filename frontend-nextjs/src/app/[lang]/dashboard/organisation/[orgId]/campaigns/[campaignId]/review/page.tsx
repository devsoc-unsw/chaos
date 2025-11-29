import {
    dehydrate,
    HydrationBoundary,
    QueryClient,
  } from '@tanstack/react-query';
import { getCampaign, getCampaignRoles } from '@/models/campaign';
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
    
    return (
      <HydrationBoundary state={dehydrate(queryClient)}>
        <ReviewCampaignApplications campaignId={campaignId} orgId={orgId} dict={dict} />
      </HydrationBoundary>
    );
  }
  