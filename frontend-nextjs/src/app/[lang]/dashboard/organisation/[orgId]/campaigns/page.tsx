import {
    dehydrate,
    HydrationBoundary,
    QueryClient,
  } from '@tanstack/react-query';
  import { getCurrentUser } from '@/lib/auth';
  
  export default async function CampaignsPage() {
    const queryClient = new QueryClient();
  
    await queryClient.prefetchQuery({
      queryKey: ['dashboard'],
      queryFn: getCurrentUser,
    });
    
    return (
      <HydrationBoundary state={dehydrate(queryClient)}>
          <Campaigns />
      </HydrationBoundary>
    );
  }
  