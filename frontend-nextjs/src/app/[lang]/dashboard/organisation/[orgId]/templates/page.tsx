import { getOrganisationEmailTemplates,  } from "@/models/email"
import { getDictionary } from "@/app/[lang]/dictionaries"
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query"
import EmailTemplates from "./templates"


export default async function EmailTemplatesPage({ params }: { params: Promise<{ orgId: string, lang: string }> }) {
  const { orgId, lang } = await params;
  const dict = await getDictionary(lang);
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: [`${orgId}-email-templates`],
    queryFn: () => getOrganisationEmailTemplates(orgId),
  });


  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <EmailTemplates orgId={orgId} dict={dict} />
    </HydrationBoundary>
  )
}
