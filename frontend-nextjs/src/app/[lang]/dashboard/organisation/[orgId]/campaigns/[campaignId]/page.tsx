import {
    dehydrate,
    HydrationBoundary,
    QueryClient,
    useQuery,
  } from '@tanstack/react-query';
import { getCampaign, getCampaignRoles } from '@/models/campaign';
import { getDictionary } from '@/app/[lang]/dictionaries';
import CampaignDetails from './campaign-details';
import { remark } from 'remark';
import html from 'remark-html';
  
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

    const campaign = await getCampaign(campaignId);

    const processedDescription = await remark()
        .use(html)
        .process(campaign.description ?? "");
    const descriptionHtml = processedDescription.toString();
    
    return (
      <HydrationBoundary state={dehydrate(queryClient)}>
          <CampaignDetails campaignId={campaignId} descriptionHtml={descriptionHtml} orgId={campaign.organisation_id} dict={dict} />
      </HydrationBoundary>
    );
  }
  