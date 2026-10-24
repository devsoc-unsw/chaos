import { getDictionary } from "@/app/[lang]/dictionaries";
import ErrorCard from "@/components/error-card";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export default async function Join({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const dict = await getDictionary(lang);
  const logoutUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL || "https://chaos-api.devsoc.app"}/auth/logout`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[hsl(220,97%,97%)] to-white font-sans flex flex-col items-center justify-center px-6">
      <ErrorCard
        title="Oops!"
        message="You are trying to access an organisation dashboard without belonging to an organisation!"
        details="Please contact your society for details."
      >
        <a href={logoutUrl} className="mt-8 inline-flex">
          <Button variant="outline" className="text-black cursor-pointer">
            <LogOut />
            {dict.common.logout}
          </Button>
        </a>
      </ErrorCard>
    </div>
  );
}
