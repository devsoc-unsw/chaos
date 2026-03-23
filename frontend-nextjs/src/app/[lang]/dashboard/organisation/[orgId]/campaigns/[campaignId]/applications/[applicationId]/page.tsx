import ApplicationOverviewPageComponent from "./application-overview-page";
import { getDictionary } from "@/app/[lang]/dictionaries";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

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
  const { lang, orgId, campaignId, applicationId } = await params;
  const dict = await getDictionary(lang);

  return (
    <div className="space-y-4">
      <div>
        <Link
          href={`/${lang}/dashboard/organisation/${orgId}/campaigns/${campaignId}/applications`}
        >
          <div className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
            {dict.common.back}
          </div>
        </Link>
      </div>
      <ApplicationOverviewPageComponent
        applicationId={applicationId}
        campaignId={campaignId}
        dict={dict}
      />
    </div>
  );
}

