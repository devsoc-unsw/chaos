import { getDictionary } from "@/app/[lang]/dictionaries"
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query"
import CampaignNewForm from './new-campaign'

export default async function CampaignNewPage({ params }: { params: Promise<{ orgId: string, lang: string }> }) {
    const { orgId, lang } = await params;
    const dict = await getDictionary(lang);
    const queryClient = new QueryClient();

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <CampaignNewForm orgId={orgId} dict={dict} />
        </HydrationBoundary>
    )
}
