import { getDictionary } from "@/app/[lang]/dictionaries";
import { getOrganisationById } from "@/models/organisation";
import type { Metadata, ResolvingMetadata } from "next";

type Props = {
    params: Promise<{ orgId: string, lang: string }>
  }

export async function generateMetadata(
    { params }: Props,
  ): Promise<Metadata> {
    // read route params
    const { orgId, lang } = await params
    const dict = await getDictionary(lang);
    
    const org = await getOrganisationById(orgId);
   
    return {
      title: `${org.name} - Chaos ${dict.dashboard.dashboard}`,
    }
  }

export default async function OrganisationRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
  
  return (
    <div>
        {children}
    </div>
  );
}
