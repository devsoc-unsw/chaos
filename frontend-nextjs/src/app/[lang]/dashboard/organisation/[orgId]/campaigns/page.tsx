import {
    dehydrate,
    HydrationBoundary,
    QueryClient,
    useQuery,
  } from '@tanstack/react-query';
import Campaigns from './campaigns';
import { getOrganisationCampaigns } from '@/models/organisation';
import { getDictionary } from '@/app/[lang]/dictionaries';
  
  export default async function CampaignsPage({ params }: { params: { orgId: string, lang: string } }) {
    const { orgId, lang } = await params;
    const dict = await getDictionary(lang);
    const queryClient = new QueryClient();
  
    await queryClient.prefetchQuery({
      queryKey: [`${orgId}-campaigns`],
      queryFn: () => getOrganisationCampaigns(orgId),
    });
    
    return (
      <HydrationBoundary state={dehydrate(queryClient)}>
          <Campaigns orgId={orgId} dict={dict} />
      </HydrationBoundary>
    );
  }
  