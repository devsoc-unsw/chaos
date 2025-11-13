import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { getCurrentUser } from '@/lib/auth';
import Dashboard from './dashboard';

export default async function Home() {
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ['dashboard'],
    queryFn: getCurrentUser,
  });
  
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
        <Dashboard />
    </HydrationBoundary>
  );
}
