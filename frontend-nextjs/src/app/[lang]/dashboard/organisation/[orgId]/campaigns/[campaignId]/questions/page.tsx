import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { getDictionary } from "@/app/[lang]/dictionaries";
import { getCampaign, getCampaignRoles } from "@/models/campaign";
import CampaignQuestions from "./campaign-questions";
import { getAllCommonQuestions, getAllRoleQuestions } from "@/models/question";

export default async function ApplicationAvgRatingsPage({ params }: { params: Promise<{ campaignId: string, orgId: string, lang: string }>; }) {
  const { lang, campaignId, orgId } = await params;
  const dict = await getDictionary(lang);
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: [`${campaignId}-campaign-details`],
    queryFn: () => getCampaign(campaignId),
  });

  await queryClient.prefetchQuery({
    queryKey: [`${campaignId}-campaign-roles`],
    queryFn: () => getCampaignRoles(campaignId),
  });

  const roles = await getCampaignRoles(campaignId);

  await queryClient.prefetchQuery({
    queryKey: [`${campaignId}-common-questions`],
    queryFn: () => getAllCommonQuestions(campaignId),
  });


  await queryClient.prefetchQuery({
    queryKey: [`${campaignId}-all-role-questions`, roles],
    queryFn: async () => {
      if (!roles) return [];
      return await Promise.all(roles.map(async (role) => {
        const questions = await getAllRoleQuestions(campaignId, role.id);
        return { role, questions };
      }));
    }
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CampaignQuestions campaignId={campaignId} orgId={orgId} dict={dict} />
    </HydrationBoundary>
  );
}