"use client";

import ApplicationRatingsSection from "@/components/application-details/application-ratings-section/application-ratings-section";
import ApplicationDetailsComponent from "../../review/application-details";
import CommentsSection from "@/components/application-details/comments-section/comments-section";
import { Separator } from "@/components/ui/separator";

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
  return (
    <div className="flex flex-col gap-4">
      <ApplicationDetailsComponent
        applicationId={applicationId}
        campaignId={campaignId}
        dict={dict}
      />
      <ApplicationRatingsSection
        applicationId={applicationId}
        campaignId={campaignId}
        dict={dict}
      />
      <Separator />
      <CommentsSection applicationId={applicationId} />
    </div>
  );
}
