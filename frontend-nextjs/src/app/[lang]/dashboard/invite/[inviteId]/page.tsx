import { getDictionary } from "@/app/[lang]/dictionaries";
import { getInvite } from "@/models/invite";
import { notFound } from "next/navigation";
import InviteClient from "./invite-client";

type Params = Promise<{ lang: string; inviteId: string }>;

export default async function Page({ params }: { params: Params }) {
  const { lang, inviteId } = await params;

  const dict = await getDictionary(lang);

  let invite;
  try {
    invite = await getInvite(inviteId);
  } catch {
    return notFound();
  }

  return <InviteClient code={inviteId} invite={invite} dict={dict} />;
}


