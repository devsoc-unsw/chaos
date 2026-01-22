import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { getCampaign } from "@/models/campaign";
import { getDictionary } from "@/app/[lang]/dictionaries";
import InterviewTimeline from "./timeline";

export default async function InterviewTimelinePage({
  params,
}: {
  params: Promise<{ campaignId: string; lang: string }>;
}) {
  const { campaignId, lang } = await params;
  const dict = await getDictionary(lang);
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: [`${campaignId}-campaign-details`],
    queryFn: () => getCampaign(campaignId),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <InterviewTimeline campaignId={campaignId} dict={dict} />
    </HydrationBoundary>
  );
}
