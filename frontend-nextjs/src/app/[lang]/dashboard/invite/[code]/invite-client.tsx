"use client";

import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import { acceptInvite, getInvite } from "@/models/invite";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

type Props = {
  code: string;
  dict: any;
};

export default function InviteClient({ code, dict }: Props) {
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
    <div className="max-w-xl mx-auto p-6 flex flex-col gap-4">
      <h1 className="text-2xl font-bold">{dict.dashboard.invite.title}</h1>
      <p className="text-sm text-muted-foreground">
        {invite?.organisation_name}{" "}
        {invite
          ? dict.dashboard.invite.invited_by
          : dict?.common?.loading ?? "Loading..."}
      </p>
      {/* Show the email the invite was sent to */}
      {invite && (
        <p className="text-sm text-muted-foreground">
          {dict.dashboard.invite.sent_to}: <span className="font-medium">{invite.email}</span>
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
      <div className="flex flex-col gap-2">
        <Link href={`/login?to=/dashboard/invite/${code}`} className="w-full">
          <Button variant="outline" className="w-full">
            {dict.dashboard.invite.login_cta}
          </Button>
        </Link>
        <Button
          onClick={handleAccept}
          disabled={status === "loading" || inviteInvalid}
          className="w-full"
        >
          {status === "loading" ? "Loading..." : dict.dashboard.invite.accept_cta}
        </Button>
        {/* Show the wrong account message if the account is not invited */}
        <p className="text-xs text-muted-foreground">
          {dict.dashboard.invite.wrong_account}
        </p>
      </div>
    </div>
  );
}


