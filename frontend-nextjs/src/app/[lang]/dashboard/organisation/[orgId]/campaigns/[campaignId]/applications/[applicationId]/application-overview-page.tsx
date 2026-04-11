"use client";

import { useState } from "react";
import ApplicationRatingsSection from "@/components/application-details/application-ratings-section/application-ratings-section";
import ApplicationDetailsComponent from "../../review/application-details";
import CommentsSection from "@/components/application-details/comments-section/comments-section";
import { Separator } from "@radix-ui/react-select";

type Props = {
  applicationId: string;
  campaignId: string;
  dict: any;
};

export default function ApplicationOverviewPageComponent({
  applicationId,
  campaignId,
  dict,
}: Props) {
  const [ratedApplications, setRatedApplications] = useState<
    Record<string, boolean>
  >({});

  return (
    <div className="flex flex-col gap-4">
      <ApplicationDetailsComponent
        applicationId={applicationId}
        campaignId={campaignId}
        dict={dict}
        ratedApplications={ratedApplications}
        setRatedApplications={setRatedApplications}
      >
        <ApplicationRatingsSection
          applicationId={applicationId}
          campaignId={campaignId}
          dict={dict}
        />
        <Separator className="my-4" />
        <CommentsSection applicationId={applicationId} />
      </ApplicationDetailsComponent>
    </div>
  );
}
