"use client";

import { Button } from "@/components/ui/button";
import { acceptInvite, getInvite } from "@/models/invite";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { User } from "@/models/user";
import { LogOut } from "lucide-react";

type Props = {
  code: string;
  currentUser?: User;
  dict: any;
};

export default function InviteClient({ code, currentUser, dict }: Props) {
  const router = useRouter();

  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const { data: invite } = useQuery({
    queryKey: [`invite-${code}`],
    queryFn: () => getInvite(code),
  });

  // After successful acceptance, redirect after a short delay.
  useEffect(() => {
    if (status === "success") {
      const timer = setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [status, router]);

  const handleAccept = async () => {
    setStatus("loading");
    setMessage(null);

    await acceptInvite(code);
    setStatus("success");
    setMessage(dict.dashboard.invite.accepted);
  };

  const inviteInvalid = !invite || invite.expired || invite.used || status === "success";

  return (
    <div className="max-w-3xl mx-auto p-6 flex flex-col gap-4">
      <h1 className="text-2xl font-bold">{dict.dashboard.invite.title}</h1>
      <p className="text-lg">
        {invite?.organisation_name}{" "}
        {dict.dashboard.invite.invited_by}
      </p>
      {/* Show the email the invite was sent to */}
      {invite && (
        <p className="text-lg">
          {dict.dashboard.invite.sent_to}: <span className="font-medium">{invite.email}</span>.
          {(!currentUser || currentUser.email !== invite.email) && dict.dashboard.invite.sent_to_note}
        </p>
      )}
      {/* Show the expired message if the invite has expired */}
      {invite?.expired && (
        <p className="text-sm text-red-600">{dict.dashboard.invite.expired}</p>
      )}
      {/* Show the used message if the invite has been used */}
      {invite?.used && (
        <p className="text-sm text-red-600">{dict.dashboard.invite.used}</p>
      )}
      {/* Show the message if there is an error */}
      {message && (
        <p className={`text-sm ${status === "success" ? "text-green-600" : "text-red-600"}`}>
          {message}
        </p>
      )}
      {
        currentUser && currentUser.email === invite?.email && (
          <Button onClick={handleAccept} disabled={status === "loading" || inviteInvalid} className="w-full">
            {status === "loading" ? "Loading..." : dict.dashboard.invite.accept_cta}
          </Button>
        )
      }
      {/* Show the wrong account message if the account is not invited */}
      {
        currentUser && currentUser.email !== invite?.email && (
          <>
            <p className="text-xl">
              {dict.dashboard.invite.wrong_account}
            </p>
            <Link href={`${process.env.NEXT_PUBLIC_API_BASE_URL || "https://chaos-api.devsoc.app"}/auth/logout`} className="w-full">
              <Button variant="outline" className="w-full">
                <LogOut />
                {dict.common.logout}
              </Button>
            </Link>
          </>
        )
      }
      {
        !currentUser && (
          <div className="flex flex-col gap-2">
            <Link href={`/login?to=/dashboard/invite/${code}`} className="w-full">
              <Button variant="outline" className="w-full">
                {dict.dashboard.invite.login_cta}
              </Button>
            </Link>
          </div>
        )
      }
    </div >
  );
}


