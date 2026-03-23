"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { getOffer, OfferDetails, OfferReply, replyToOffer, OfferStatus } from "@/models/offer";
import { dateToString } from "@/lib/utils";

export default function AcceptOffer({offerId}:{offerId:string}) {
  const { data: offerDetails } = useQuery({
    queryKey: [`offer-${offerId}`],
    queryFn: () => getOffer(offerId),
  });

  const [ answered, setAnswered ] = useState(offerDetails?.status !== "Draft");

  const handleReply = async (reply:OfferReply) => {
    await replyToOffer(offerId, reply)
    setAnswered(true);
  }

  if (answered) {
    return (
         <div className="flex min-h-screen items-center justify-center">
            <p>
                Thank you for making a decision on this offer. You will be returned to the homepage shortly.
            </p>
        </div>
    )
  }
  return (
    <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-xl space-y-4 rounded-lg border bg-background p-6 shadow-sm">
            <div>
                <h2 className="text-lg font-semibold">Congratulations!</h2>
            </div>

            <div className="space-y-3 text-sm">
                {!answered && !offerDetails && <p>Loading offer...</p>}

                {!answered && offerDetails && (
                    <div className="space-y-2">
                        <p>
                            Dear {offerDetails.user_name}, congratulations! We are please to inform you that you have been successful in your application to {offerDetails.organisation_name}'s {offerDetails.campaign_name}!
                            You have been accepted for the following role: {offerDetails.role_name}. Please accept this offer by {offerDetails.expiry}.
                        </p>
                        <p>
                            You have been accepted for the following role: {offerDetails.role_name}.
                        </p>
                        <p>
                            Please accept this offer by {dateToString(offerDetails.expiry)}.
                        </p>
                    </div>
                )}
            </div>

            <div className="flex flex-wrap gap-2">
                <Button
                variant="destructive"
                onClick={() => {
                    handleReply({accept: false})
                }}
                disabled={!offerDetails || answered}
                >
                Reject
                </Button>
                <Button
                onClick={() => {
                    handleReply({accept: true})
                }}
                disabled={!offerDetails || answered}
                >
                Accept
                </Button>
            </div>
        </div>
    </div>
  );
}