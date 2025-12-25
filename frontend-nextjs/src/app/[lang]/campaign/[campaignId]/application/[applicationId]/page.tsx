import {
  QueryClient,
  dehydrate,
  HydrationBoundary,
} from "@tanstack/react-query";
import ApplicationReview from "./applicationanswer";
import { ApplicationDetails } from "@/models/application";
import { getDictionary } from "@/app/[lang]/dictionaries";
import { getCampaignRoles, getCampaign } from "@/models/campaign";
import { getInProgressApplication } from "@/models/application";
import { getAllRoleQuestions, getAllCommonQuestions } from "@/models/question";
import { getAllRoleAnswers, getAllCommonAnswers} from "@/models/answer";
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
      redirect(`/campaign/${campaignId}/finish`);
    }
    const QApromises = [];
    // how do you make this part faster idrk(could not find anything on Reddit so decided to ask cursor 4 suggestions)
    for (const role of application?.applied_roles ?? []) {
      QApromises.push(
        queryClient.prefetchQuery({
          queryKey: [`${campaignId}-${role.campaign_role_id}-role-questions`],
          queryFn: () => getAllRoleQuestions(campaignId, role.campaign_role_id),
        })
      );

      QApromises.push(
        queryClient.prefetchQuery({
          queryKey: [`${applicationId}-${role.campaign_role_id}-role-answers`],
          queryFn: () => getAllRoleAnswers(applicationId, role.campaign_role_id),
        })
      );
    }

    QApromises.push(
      queryClient.prefetchQuery({
        queryKey: [`${applicationId}-common-questions`],
        queryFn: () => getAllCommonQuestions(campaignId),
      })
    );

    QApromises.push(
      queryClient.prefetchQuery({
        queryKey: [`${applicationId}-common-answers`],
        queryFn: () => getAllCommonAnswers(applicationId),
      })
    );

    await Promise.all(QApromises);

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