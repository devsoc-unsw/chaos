import {
    dehydrate,
    HydrationBoundary,
    QueryClient,
  } from '@tanstack/react-query';
import Campaigns from './campaigns';
import { getOrganisationCampaigns } from '@/models/organisation';
  
  export default async function CampaignsPage({ params }: { params: { orgId: string } }) {
    const { orgId } = await params;
    const queryClient = new QueryClient();
  
    await queryClient.prefetchQuery({
      queryKey: [`${orgId}-campaigns`],
      queryFn: () => getOrganisationCampaigns(orgId),
    });
    
    return (
      <HydrationBoundary state={dehydrate(queryClient)}>
          <Campaigns orgId={orgId} />
      </HydrationBoundary>
    );
  }
  