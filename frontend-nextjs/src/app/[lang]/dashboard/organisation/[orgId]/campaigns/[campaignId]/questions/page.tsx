import { getDictionary } from "@/app/[lang]/dictionaries";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import CampaignQuestions from './campaign-questions';
import { getCampaign } from "@/models/campaign";
import { getCampaignQuestionTemplates } from "@/models/interview_questions";

export default async function CampaignQuestionsPage({params} : { params: Promise<{campaignId: string, orgId: string, lang: string }>}) {
    const { campaignId, orgId, lang } = await params;
    const dict = await getDictionary(lang);
    const queryClient = new QueryClient();

    queryClient.prefetchQuery({
        queryKey: [`${campaignId}-campaign-details`],
        queryFn: () => getCampaign(campaignId),
    });

    queryClient.prefetchQuery({
        queryKey: [`${campaignId}-campaign-templates`],
        queryFn: () => getCampaignQuestionTemplates(campaignId),
    });

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <CampaignQuestions campaignId={campaignId} orgId={orgId} dict={dict}/>
        </HydrationBoundary>
    )
}