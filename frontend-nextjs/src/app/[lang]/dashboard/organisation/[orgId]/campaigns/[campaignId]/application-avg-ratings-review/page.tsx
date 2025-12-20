import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { getDictionary } from "@/app/[lang]/dictionaries";
import { getApplicationAvgRatings } from "@/models/application";
import ApplicationAvgRatingsApplicants from "./applicaton-avg-details";

export default async function ApplicationAvgRatingsPage({ params }: { params: Promise<{ campaignId: string, orgId: string, lang: string }>; }) {
    const { lang, campaignId, orgId } = await params;
    const dict = await getDictionary(lang);
    const queryClient = new QueryClient();

    await queryClient.prefetchQuery({
      queryKey: [`${campaignId}-application-avg-ratings`],
      queryFn: () => getApplicationAvgRatings(campaignId),
    });


    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
        <ApplicationAvgRatingsApplicants campaignId={campaignId} orgId={orgId} dict={dict} />
        </HydrationBoundary>
    );
}