import {
  QueryClient,
  dehydrate,
  HydrationBoundary,
} from "@tanstack/react-query";
import ApplicationReview from "./application-answer";
import { ApplicationDetails } from "@/models/application";
import { getDictionary } from "@/app/[lang]/dictionaries";
import { getCampaignRoles, getCampaign } from "@/models/campaign";
import { getApplication, getInProgressApplication } from "@/models/application";
import { getApplicationQuestionsAnswers } from "@/models/question";
import { redirect } from "next/navigation";

async function ApplicationPage({
  params,
}: {
  params: Promise<{ lang: string; campaignId: string; applicationId: string }>;
}) {
    const { lang, campaignId, applicationId } = await params;
    const queryClient = new QueryClient();
    const dict = await getDictionary(lang);

  await queryClient.prefetchQuery({
    queryKey: [`application-${applicationId}`],
    queryFn: () => getInProgressApplication(applicationId)
  })

    const application: ApplicationDetails | undefined = queryClient.getQueryData([`application-${applicationId}`]);

    if (!application) {
      redirect(`/campaign/apply/${campaignId}/finish`);
    }

    await queryClient.prefetchQuery({
        queryKey: [`${applicationId}-questions-answers`],
        queryFn: () => getApplicationQuestionsAnswers(applicationId),
    })

    await queryClient.prefetchQuery({
        queryKey: [`${campaignId}-campaign-info`],
        queryFn: () => getCampaign(campaignId),
    });

    await queryClient.prefetchQuery({
        queryKey: [`${campaignId}-campaign-roles`],
        queryFn: () => getCampaignRoles(campaignId),
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