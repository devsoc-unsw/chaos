import { getDictionary } from "@/app/[lang]/dictionaries"
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query"
import TemplateNewForm from "./new-template";


export default async function TemplateNewPage({ params }: { params: { orgId: string, lang: string } }) {
  const { orgId, lang } = await params;
  const dict = await getDictionary(lang);
  const queryClient = new QueryClient();


  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TemplateNewForm orgId={orgId} dict={dict} />
    </HydrationBoundary>
  )
}
