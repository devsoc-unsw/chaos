import { redirect } from "next/navigation";
import { createOrGetApplication } from "@/models/application";

async function ApplyPage({ params }: { params: Promise<{ campaignId: string; lang: string }> }) {
  const { campaignId, lang } = await params;

  let response;
  try {
    response = await createOrGetApplication(campaignId);
  } catch (error) {
    console.error("Failed to create/get application:", error);
    redirect(`/${lang}/campaign/apply/${campaignId}/finish`);
  }

  redirect(`/${lang}/campaign/apply/${campaignId}/application/${response.application_id}`);
}

export default ApplyPage;