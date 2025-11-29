import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AdminSidebar } from "@/components/admin-sidebar"
import { getDictionary } from "@/app/[lang]/dictionaries";
import { getCurrentUser } from "@/lib/auth";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { getAllOrganisations } from "@/models/organisation";

export default async function Layout({ children, params }: { children: React.ReactNode, params: { lang: string } }) {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  
  // Guard to ensure dashboard doesn't render if user not authenticated
  await getCurrentUser();
  
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ['user'],
    queryFn: getCurrentUser,
  });

  await queryClient.prefetchQuery({
    queryKey: ['organisations'],
    queryFn: getAllOrganisations,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SidebarProvider>
        <AdminSidebar dict={dict} />
        <main className="w-full">
          <SidebarTrigger />
          <div className="mx-2">
            {children}
          </div>
        </main>
      </SidebarProvider>
    </HydrationBoundary>
  )
}