import { getEmailTemplate,  } from "@/models/email"
import { getDictionary } from "@/app/[lang]/dictionaries"
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query"
import TemplateEditForm from "./edit-template";


export default async function TemplateEditPage({ params }: { params: { orgId: string, templateId: string, lang: string } }) {
  const { orgId, templateId, lang } = await params;
  const dict = await getDictionary(lang);
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: [`${templateId}-email-template`],
    queryFn: () => getEmailTemplate(templateId),
  });


  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TemplateEditForm templateId={templateId} orgId={orgId} dict={dict} />
    </HydrationBoundary>
  )
}
