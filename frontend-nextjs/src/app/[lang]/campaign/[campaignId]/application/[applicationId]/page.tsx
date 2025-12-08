import {
  QueryClient,
  dehydrate,
  HydrationBoundary,
} from "@tanstack/react-query";
import ApplicationReview from "./applicationreview";
import { getDictionary } from "@/app/[lang]/dictionaries";
import { getCampaignRoles, getCampaign } from "@/models/campaign";
import { getApplication } from "@/models/application";

async function ApplicationPage({
  params,
}: {
  params: Promise<{ lang: string; campaignId: string; applicationId: string }>;
}) {
    const { lang, campaignId, applicationId } = await params;
    const queryClient = new QueryClient();
    const dict = await getDictionary(lang);

    await queryClient.prefetchQuery({
        queryKey: [`${campaignId}-campaign-info`],
        queryFn: () => getCampaign(campaignId),
    });

    await queryClient.prefetchQuery({
        queryKey: [`${campaignId}-campaign-roles`],
        queryFn: () => getCampaignRoles(campaignId),
    });

    await queryClient.prefetchQuery({
      queryKey: [`${applicationId}-application`],
      queryFn: () => getApplication(applicationId),
    });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
        <ApplicationReview
        campaignId={campaignId}
        applicationId={applicationId}
        dict={dict}
      />
    </HydrationBoundary>
  )
}

export default ApplicationPage