import {
    dehydrate,
    HydrationBoundary,
    QueryClient,
    useQuery,
  } from '@tanstack/react-query';
import { getCampaign, getCampaignAttachments, getCampaignRoles } from '@/models/campaign';
import { getDictionary } from '@/app/[lang]/dictionaries';
import CampaignDetails from './campaign-details';
import { remark } from 'remark';
import html from 'remark-html';
import { getRatingCategories } from '@/models/rating';
  
  export default async function CampaignDetailsPage({ params }: { params: Promise<{ campaignId: string, lang: string }> }) {
    const { campaignId, lang } = await params;
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
      queryKey: [`${campaignId}-rating-categories`],
      queryFn: () => getRatingCategories(campaignId),
    });

    await queryClient.prefetchQuery({
      queryKey: [`${campaignId}-attachments`],
      queryFn: () => getCampaignAttachments(campaignId),
    });

    const campaign = await getCampaign(campaignId);

    return (
      <HydrationBoundary state={dehydrate(queryClient)}>
          <CampaignDetails campaignId={campaignId} orgId={campaign.organisation_id} dict={dict} />
      </HydrationBoundary>
    );
  }
  