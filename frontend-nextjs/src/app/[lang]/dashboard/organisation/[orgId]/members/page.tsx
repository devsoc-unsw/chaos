import { getDictionary } from "@/app/[lang]/dictionaries"
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query"
import OrganisationMembers from "./members"
import { getAllOrganisationMembers } from "@/models/organisation";


export default async function OrganisationMembersPage({ params }: { params: Promise<{ orgId: string, lang: string }> }) {
  const { orgId, lang } = await params;
  const dict = await getDictionary(lang);
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: [`${orgId}-members`],
    queryFn: () => getAllOrganisationMembers(orgId),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <OrganisationMembers orgId={orgId} dict={dict} />
    </HydrationBoundary>
  )
}
