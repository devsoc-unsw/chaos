"use client";

import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import { acceptInvite, InviteDetails } from "@/models/invite";
import Link from "next/link";
import { useState } from "react";

type Props = {
  code: string;
  invite: InviteDetails;
  dict: any;
};

export default function InviteClient({ code, invite, dict }: Props) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const handleAccept = async () => {
    setStatus("loading");
    setMessage(null);
    try {
      await acceptInvite(code);
      setStatus("success");
      setMessage(dict.dashboard.invite.accepted);
    } catch (err) {
      setStatus("error");
      if (err instanceof ApiError) {
        setMessage(err.message);
      } else {
        setMessage("Something went wrong. Please try again.");
      }
    }
  };

  const inviteInvalid = invite.expired || invite.used;

  return (
    <div className="max-w-xl mx-auto p-6 flex flex-col gap-4">
      <h1 className="text-2xl font-bold">{dict.dashboard.invite.title}</h1>
      <p className="text-sm text-muted-foreground">
        {dict.dashboard.invite.invited_by.replace("{org}", invite.organisation_name)}
      </p>
      <p className="text-sm text-muted-foreground">
        {dict.dashboard.invite.sent_to}: <span className="font-medium">{invite.email}</span>
      </p>
      {invite.expired && (
        <p className="text-sm text-red-600">{dict.dashboard.invite.expired}</p>
      )}
      {invite.used && (
        <p className="text-sm text-red-600">{dict.dashboard.invite.used}</p>
      )}
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
        <p className="text-xs text-muted-foreground">
          {dict.dashboard.invite.wrong_account}
        </p>
      </div>
    </div>
  );
}


