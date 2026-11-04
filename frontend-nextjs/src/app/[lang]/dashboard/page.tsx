import { redirect } from "next/navigation";
import { getAllOrganisations } from "@/models/organisation";

export default async function DashboardRedirect() {
  const orgs = await getAllOrganisations();

  if (orgs.length === 0) {
    redirect(`/dashboard/join`);
  }

  redirect(`/dashboard/organisation/${orgs[0].id}`);
}
