import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query';
import { getCurrentUser } from '@/lib/auth';
import Dashboard from './dashboard';

export default async function DashboardPage() {  
  return (
    <Dashboard />
  );
}
