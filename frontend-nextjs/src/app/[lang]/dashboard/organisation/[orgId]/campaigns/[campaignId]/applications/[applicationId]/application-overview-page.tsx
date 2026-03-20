"use client";

import { useState } from "react";
import type { ApplicationDetails } from "@/models/application";
import ApplicationDetailsComponent from "../../review/application-details";

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
  const [ratedApplications, setRatedApplications] = useState<Record<string, boolean>>(
    {}
  );

  return (
    <div className="flex flex-col gap-4">
      <ApplicationDetailsComponent
        applicationId={applicationId}
        campaignId={campaignId}
        dict={dict}
        ratedApplications={ratedApplications}
        setRatedApplications={setRatedApplications}
      />
    </div>
  );
}

