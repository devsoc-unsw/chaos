import ApplicationOverviewPageComponent from "./application-overview-page";
import { getDictionary } from "@/app/[lang]/dictionaries";

export default async function ApplicationOverviewPage({
  params,
}: {
  params: Promise<{
    lang: string;
    orgId: string;
    campaignId: string;
    applicationId: string;
  }>;
}) {
  const { lang, campaignId, applicationId } = await params;
  const dict = await getDictionary(lang);

  return (
    <div className="space-y-4">
      <ApplicationOverviewPageComponent
        applicationId={applicationId}
        campaignId={campaignId}
        dict={dict}
      />
    </div>
  );
}

