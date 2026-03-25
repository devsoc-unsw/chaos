import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { getOffer } from "@/models/offer";
import { redirect } from "next/navigation";
import { OfferDetails } from "@/models/offer";
import AcceptOffer from "./accept-offer";

export default async function OfferPage({
  params,
}: {
  params: Promise<{
    lang: string;
    orgSlug: string;
    campaignSlug: string;
    offerId: string;
  }>;
}) {
  const { offerId } = await params;

  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: [`offer-${offerId}`],
    queryFn: () => getOffer(offerId),
  });

  const offer: OfferDetails | undefined = queryClient.getQueryData([`offer-${offerId}`]);

  if (!offer) {
    redirect(`/error`);
  }

  return (
   <HydrationBoundary state={dehydrate(queryClient)}>
     <AcceptOffer offerId={offerId} />
    </HydrationBoundary>
  );
}

