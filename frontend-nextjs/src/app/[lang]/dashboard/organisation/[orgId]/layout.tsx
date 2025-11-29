import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AdminSidebar } from "@/components/admin-sidebar"
import { getDictionary } from "@/app/[lang]/dictionaries";
import { getCurrentUser } from "@/lib/auth";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { getAllOrganisations, getOrganisationById, getOrganisationUserRole } from "@/models/organisation";
import { Metadata } from "next";

type Props = {
  params: Promise<{ orgId: string, lang: string }>
}

export async function generateMetadata(
  { params }: Props,
): Promise<Metadata> {
  // read route params
  const { orgId, lang } = await params
  const dict = await getDictionary(lang);
  
  const org = await getOrganisationById(orgId);
 
  return {
    title: `${org.name} - Chaos ${dict.common.dashboard}`,
  }
}

export default async function Layout({ children, params }: { children: React.ReactNode, params: { orgId: string,lang: string } }) {
  const { orgId, lang } = await params;
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

  await queryClient.prefetchQuery({
    queryKey: [`${orgId}-organisation-user-role`],
    queryFn: () => getOrganisationUserRole(orgId),
  });

  const userRole = await getOrganisationUserRole(orgId);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SidebarProvider>
        <AdminSidebar userRole={userRole} dict={dict} />
        <main className="w-full">
          <SidebarTrigger />
          <div className="px-2 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </SidebarProvider>
    </HydrationBoundary>
  )
}