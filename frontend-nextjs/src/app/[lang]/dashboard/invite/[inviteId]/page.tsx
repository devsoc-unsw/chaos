"use client";

import type { InviteDetails } from "@/models/invite";
import { useParams } from "next/navigation";
import InviteClient from "./invite-client";

export default function Page() {
  const params = useParams<{ lang?: string; inviteId?: string }>();
  const code = params?.inviteId ?? "mock-invite-code";

  const invite: InviteDetails = {
    organisation_id: "1",
    organisation_name: "Chaos Demo Org",
    email: "invited.user@example.com",
    expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
    used: false,
    expired: false,
  };

  // Minimal dict mock so the UI renders without pulling translations.
  const dict = {
    dashboard: {
      invite: {
        title: "Organisation invite",
        invited_by: "You’ve been invited to join {org}.",
        sent_to: "Invite sent to",
        expired: "This invite has expired.",
        used: "This invite has already been used.",
        login_cta: "Log in",
        accept_cta: "Accept invite",
        accepted: "Invite accepted (mock).",
        wrong_account: "Not you? Log in with a different account.",
      },
    },
  };

  return <InviteClient code={code} invite={invite} dict={dict} mockMode />;
}


