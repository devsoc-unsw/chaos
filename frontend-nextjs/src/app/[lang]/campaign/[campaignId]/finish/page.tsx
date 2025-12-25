import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { getCampaign } from "@/models/campaign";
import { getDictionary } from "@/app/[lang]/dictionaries"
import Finish from "./finish";;

async function FinishPage({
  params,
}: {
  params: Promise<{campaignId: string; lang: string;}>;
}){
    const {campaignId, lang} = await params;
    const queryClient = new QueryClient();
    const dict = await getDictionary(lang);

    await queryClient.prefetchQuery({
        queryKey: [`${campaignId}-campaign-info`],
        queryFn: () => getCampaign(campaignId),
    });
   return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <Finish
                campaignId={campaignId}
                dict={dict}
            />
        </HydrationBoundary>
  )
}

export default FinishPage